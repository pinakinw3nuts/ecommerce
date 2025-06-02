import { buildApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { AppDataSource } from './database';

/**
 * Start the server and handle graceful shutdown
 */
async function startServer() {
  try {
    const app = await buildApp();
    
    // Start listening
    await app.listen({ 
      port: config.port,
      host: config.host
    });
    
    logger.info(`🚀 Server started on ${config.host}:${config.port}`);
    logger.info(`📚 API documentation available at http://${config.host}:${config.port}/documentation`);
    
    // Log all registered routes in development
    if (!config.isProduction) {
      const routes = app.printRoutes();
      logger.debug(`Registered routes:\n${routes}`);
    }
    
    // Handle graceful shutdown
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;
    
    for (const signal of signals) {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, gracefully shutting down...`);
        
        try {
          // Close the server first to stop accepting new connections
          await app.close();
          logger.info('HTTP server closed');
          
          // Close database connections
          if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            logger.info('Database connections closed');
          }
          
          logger.info('Shutdown completed successfully');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
          process.exit(1);
        }
      });
    }
    
    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      logger.fatal('Uncaught exception', { 
        error: error.message, 
        stack: error.stack 
      });
      
      // Exit with error
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, _promise) => {
      logger.fatal('Unhandled rejection', { 
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined
      });
      
      // Exit with error
      process.exit(1);
    });
  } catch (error) {
    // Enhanced error logging
    logger.fatal('Fatal error starting server', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    });
    process.exit(1);
  }
}

// Start the server
startServer(); 