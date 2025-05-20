import 'reflect-metadata';
import { buildApp } from './index';
import { config } from './config/env';
import { logger } from './utils/logger';

async function bootServer() {
  try {
    // Log startup configuration
    logger.info('Starting server with configuration:', {
      port: config.server.port,
      nodeEnv: config.server.nodeEnv,
      databaseUrl: config.database.url.replace(/:[^:@]+@/, ':***@'), // Hide password
      externalServices: {
        tax: config.services.tax,
        cart: config.services.cart,
        user: config.services.user,
        product: config.services.product
      }
    });

    const app = await buildApp();
    
    // Log all registered routes for debugging
    app.log.debug('Registered routes:', {
      routes: app.printRoutes()
    });
    
    const address = await app.listen({
      port: config.server.port,
      host: '0.0.0.0' // Listen on all available network interfaces
    });

    logger.info(`🚀 Server successfully started at ${address}`);
    logger.info(`📚 Swagger documentation available at ${address}/documentation`);
    logger.info('Environment:', config.server.nodeEnv);
    
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
    // Enhanced error logging
    const errorDetails = {
      name: err instanceof Error ? err.name : 'Unknown Error',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      details: err
    };

    logger.error('Failed to start server:', errorDetails);
    console.error('Server startup error:', errorDetails); // Fallback console logging
    process.exit(1);
  }
}

// Add global unhandled error handlers
process.on('unhandledRejection', (reason, promise) => {
  const errorDetails = {
    name: reason instanceof Error ? reason.name : 'UnhandledRejection',
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise
  };

  logger.error('Unhandled Rejection:', errorDetails);
  console.error('Unhandled Rejection:', errorDetails); // Fallback console logging
});

process.on('uncaughtException', (error) => {
  const errorDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };

  logger.error('Uncaught Exception:', errorDetails);
  console.error('Uncaught Exception:', errorDetails); // Fallback console logging
  process.exit(1);
});

// Start the server
bootServer(); 