import { buildApp } from './app';
import { config } from './config';
import logger from './utils/logger';
import { closeEmailQueue } from './queues/emailQueue';
import { initializeQueues, retryFailedJobs } from './services/queueService';
import { initializeRedis, closeRedis } from './utils/redis';

// Keep track of shutdown status to prevent multiple shutdown attempts
let isShuttingDown = false;

// Start the server
async function startServer() {
  try {
    // Initialize Redis first
    logger.info('Initializing Redis connection...');
    try {
      await initializeRedis();
    } catch (error) {
      if (config.isDevelopment) {
        logger.warn('Failed to initialize Redis in development mode - continuing with limited functionality', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } else {
        throw error;
      }
    }
    
    // Initialize the queues
    logger.info('Initializing notification queues...');
    try {
      await initializeQueues();
      
      // Try to recover any failed jobs from previous runs
      try {
        const retriedJobs = await retryFailedJobs('email');
        if (retriedJobs > 0) {
          logger.info(`Recovered ${retriedJobs} failed email jobs from previous run`);
        }
      } catch (error) {
        logger.warn('Could not retry failed jobs from previous run', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Continue startup despite retry failure
      }
    } catch (error) {
      if (config.isDevelopment) {
        logger.warn('Failed to initialize queues in development mode - continuing with limited functionality', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } else {
        throw error;
      }
    }
    
    // Build the Fastify app
    logger.info('Building Fastify application...');
    const app = await buildApp();
    
    // Start listening for requests
    const host = '0.0.0.0'; // Listen on all network interfaces
    const port = config.port;
    
    const address = await app.listen({ host, port });
    logger.info(`Notification service started on ${address}`);
    
    // Setup graceful shutdown
    setupGracefulShutdown(app);
    
    return app;
  } catch (error) {
    logger.error('Failed to start notification service', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    
    // Exit with error code
    process.exit(1);
  }
}

// Handle graceful shutdown
function setupGracefulShutdown(app: any) {
  // Function to perform the shutdown
  async function performShutdown(signal: string) {
    if (isShuttingDown) {
      logger.info(`Shutdown already in progress, ignoring ${signal}`);
      return;
    }
    
    isShuttingDown = true;
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    try {
      // Close the Fastify server first to stop accepting new requests
      await app.close();
      logger.info('HTTP server closed');
      
      // Close queue connections
      try {
        await closeEmailQueue();
        logger.info('Queue connections closed');
      } catch (error) {
        logger.warn('Error closing queue connections', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Close Redis connection
      try {
        await closeRedis();
        logger.info('Redis connection closed');
      } catch (error) {
        logger.warn('Error closing Redis connection', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      logger.info('Shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    }
  }
  
  // Register shutdown handlers for different signals
  process.on('SIGTERM', () => performShutdown('SIGTERM'));
  process.on('SIGINT', () => performShutdown('SIGINT'));
  
  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack
    });
    
    performShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined
    });
    
    performShutdown('unhandledRejection');
  });
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Fatal error starting server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  });
}

// Export for testing
export { startServer }; 