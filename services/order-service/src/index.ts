import { buildApp } from './app';
import { closeDatabase } from './data-source';
import { logger } from './utils/logger';
import { config } from './config/env';

// This ensures Swagger is properly defined even when imported directly
import '@fastify/swagger';
import '@fastify/swagger-ui';

const startServer = async () => {
  try {
    // Build the app - database initialization happens inside buildApp()
    const app = await buildApp();
    
    // Start listening for connections
    const port = config.port || 3006;
    await app.listen({ 
      port,
      host: '0.0.0.0'
    });

    logger.info(`🚀 Order service is running on port ${port} in ${config.nodeEnv} mode`);
    
    // Log API documentation URL
    logger.info(`API documentation available at http://localhost:${port}/documentation`);
    
    // Handle graceful shutdown
    const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
    
    shutdownSignals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal} signal. Starting graceful shutdown...`);
        
        try {
          // First close the server
          await app.close();
          logger.info('HTTP server closed');
          
          // Then close the database connection
          await closeDatabase();
          logger.info('All connections closed. Shutdown complete.');
          
          process.exit(0);
        } catch (err) {
          logger.error('Error during graceful shutdown:', err);
          process.exit(1);
        }
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? {
      message: reason.message,
      stack: reason.stack
    } : reason
  });
  
  // In development, don't exit immediately to allow debugging
  if (config.isProduction) {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error
  });
  
  // Always exit on uncaught exceptions as the process may be in an unstable state
  process.exit(1);
});

// Start the server
startServer(); 