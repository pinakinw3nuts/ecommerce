import { env } from './config/env';
import { buildApp } from './app';
import { AppDataSource } from './config/dataSource';
import { logger } from './utils/logger';

export async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    logger.info('Database connection established successfully');

    // Build and start the app
    const app = await buildApp();
    
    // Start listening
    await app.listen({ 
      port: env.PORT,
      host: env.HOST
    });
    
    logger.info(`🚀 CMS service running on port ${env.PORT}`);
    logger.info(`📚 API documentation available at http://${env.HOST}:${env.PORT}/documentation`);
    
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

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch(error => {
    logger.error('Failed to start server:', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  });
} 