import { buildApp } from './app';
import { config } from './config';
import logger from './utils/logger';
import { closeEmailQueue } from './queues/emailQueue';
import { initializeQueues, retryFailedJobs } from './services/queueService';
import { initializeRedis, closeRedis } from './utils/redis';

// Keep track of shutdown status to prevent multiple shutdown attempts
let isShuttingDown = false;

/**
 * Initialize required services and infrastructure
 */
async function initializeServices() {
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
}

/**
 * Display service information in console
 */
function displayServiceInfo(host: string, port: number): void {
  const baseUrl = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
  const docsUrl = `${baseUrl}/documentation`;
  const healthUrl = `${baseUrl}/health`;
  
  console.log('\n');
  console.log('========================================');
  console.log('🚀 Notification Service is running!');
  console.log('----------------------------------------');
  console.log(`📚 API Documentation: ${docsUrl}`);
  console.log(`💓 Health Check: ${healthUrl}`);
  console.log('========================================');
  console.log('\n');
  
  // Also log to structured logger
  logger.info(`API Documentation available at: ${docsUrl}`);
  logger.info(`Health Check available at: ${healthUrl}`);
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Start the server with automatic port selection if preferred port is in use
 */
async function startServer() {
  try {
    // Initialize services
    await initializeServices();
    
    // Build the Fastify app
    logger.info('Building Fastify application...');
    const app = await buildApp();
    
    // Determine best host based on platform
    const host = process.platform === 'win32' ? '127.0.0.1' : '0.0.0.0';
    const preferredPort = config.port;
    
    // Try preferred port first, then fallback to a range of ports
    // Use dynamic port allocation in a wider range
    const portsToTry = [
      preferredPort, 
      3030, 3031, 3032, 3033, 3034, 3035, 3036, 3037, 3038, 3039,
      5000, 5001, 5002, 5003, 5004, 5005, 
      8080, 8081, 8082, 8083, 8084, 8085
    ];
    
    let serverAddress = '';
    let boundPort = 0;
    
    for (const port of portsToTry) {
      try {
        // Start the server
        logger.info(`Attempting to bind to ${host}:${port}...`);
        serverAddress = await app.listen({ host, port });
        boundPort = port;
        logger.info(`Notification service started on ${serverAddress}`);
        break; // Successfully bound to a port, exit the loop
      } catch (error) {
        const isLastPort = port === portsToTry[portsToTry.length - 1];
        
        if (!isLastPort) {
          logger.warn(`Port ${port} is in use, trying next port...`);
          // Small delay to avoid overwhelming the system with rapid bind attempts
          await sleep(100);
        } else {
          // If we've tried all ports in our list, try a random port as last resort
          try {
            // Use port 0 to let the OS assign a random available port
            logger.info(`Attempting to bind to ${host} on a random port...`);
            serverAddress = await app.listen({ host, port: 0 });
            const addressInfo = app.server.address();
            boundPort = typeof addressInfo === 'object' && addressInfo !== null ? addressInfo.port : 0;
            logger.info(`Notification service started on ${serverAddress} (random port ${boundPort})`);
            break; // Successfully bound to a port
          } catch (randomPortError) {
            logger.error(`Failed to bind to any port, including random port assignment`, {
              error: randomPortError instanceof Error ? randomPortError.message : 'Unknown error'
            });
            throw randomPortError;
          }
        }
      }
    }
    
    // Display service information
    displayServiceInfo(host, boundPort);
    
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
    
    // Log detailed error for easier debugging
    if (error instanceof Error) {
      console.error('Detailed error information:');
      console.error(error);
    }
    
    // Exit with error code
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
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