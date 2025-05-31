import { buildApp } from './app';
import { env } from './config/env';
import logger from './utils/logger';
import { AppDataSource } from './config/dataSource';

// Use port from env config
const PORT = env.PORT;
const HOST = env.HOST || '0.0.0.0';

/**
 * Start the server with proper error handling and graceful shutdown
 */
const start = async () => {
  let app: any;

  try {
    // Build the Fastify application
    app = await buildApp();
    
    // Start listening on the configured port
    await app.listen({ 
      port: PORT, 
      host: HOST 
    });
    
    logger.info(`Company Service started successfully on ${HOST}:${PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    
    // Log successful startup
    if (env.NODE_ENV === 'development') {
      logger.info(`
      📋 API Documentation: http://${HOST}:${PORT}/docs
      🔍 Health Check: http://${HOST}:${PORT}/health
      🚀 API Endpoints: http://${HOST}:${PORT}/api/v1/...
      `);
    }
  } catch (err) {
    logger.error({ err }, 'Error starting Company Service');
    process.exit(1);
  }

  // Setup graceful shutdown handlers
  setupGracefulShutdown(app);
};

/**
 * Configure handlers for graceful shutdown
 */
function setupGracefulShutdown(app: any): void {
  // Array of signals to handle
  const signals = ['SIGTERM', 'SIGINT', 'SIGHUP'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Close the server to stop accepting new connections
        if (app) {
          await app.close();
          logger.info('Server closed successfully');
        }
        
        // Close database connections
        if (AppDataSource && AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info('Database connection closed successfully');
        }
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
      }
    });
  });
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection');
  // Don't exit the process here, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception');
  // For uncaught exceptions, we should exit after logging
  process.exit(1);
});

// Start the server
start(); 