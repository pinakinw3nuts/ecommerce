import 'reflect-metadata';
import { buildApp } from './index';
import { config } from './config/env';
import logger from './utils/logger';

async function bootServer() {
  try {
    const app = await buildApp();
    
    // Log all registered routes for debugging
    app.log.debug('Registered routes:', {
      routes: app.printRoutes()
    });
    
    const address = await app.listen({
      port: config.PORT,
      host: '0.0.0.0' // Listen on all available network interfaces
    });

    logger.info(`🚀 Server successfully started at ${address}`);
    logger.info(`📚 Swagger documentation available at ${address}/documentation`);
    logger.info('Environment:', config.NODE_ENV);
    
    // Handle graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        
        try {
          await app.close();
          logger.info('Server closed successfully');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    }

  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
bootServer(); 