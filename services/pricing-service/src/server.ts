// Register module aliases first
import './config/module-alias';

import fastify from 'fastify';
import { env } from '@config/env';
import { createLogger } from '@utils/logger';
import { app } from './app';

const logger = createLogger('server');

/**
 * Start the server
 */
async function startServer() {
  try {
    // Create Fastify instance
    const server = fastify({
      logger: false, // We use our own logger
      trustProxy: true
    });

    // Register the application
    await server.register(app);

    // Start listening
    await server.listen({ 
      port: env.PORT, 
      host: env.HOST 
    });

    logger.info({
      port: env.PORT,
      environment: env.NODE_ENV,
      url: `http://${env.HOST}:${env.PORT}`
    }, 'Server started successfully');

    // Log documentation URL
    logger.info(`API Documentation available at: http://${env.HOST}:${env.PORT}/documentation`);

    // Handle graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'] as const;
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info({ signal }, 'Shutting down server');
        
        await server.close();
        logger.info('Server shutdown complete');
        
        process.exit(0);
      });
    });

  } catch (err) {
    const error = err as Error;
    logger.fatal({ error: error.message, stack: error.stack }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
startServer(); 