import { FastifyInstance } from 'fastify';
import { buildApp } from './app';
import { env } from './config/env';
import logger from './utils/logger';

// Server instance
let server: FastifyInstance;

// Graceful shutdown function
async function closeGracefully(signal: string) {
  logger.info(`Shutting down: ${signal}`);
  
  try {
    if (server) {
      await server.close();
    }
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown');
    process.exit(1);
  }
}

// Start the server
const start = async () => {
  try {
    // Initialize application
    server = await buildApp({
      logger: false, // We use our own logger
      disableRequestLogging: true, // We'll handle this in our middleware
    });
    
    // Start listening
    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Admin service running at http://localhost:${env.PORT}`);
  } catch (err: unknown) {
    logger.error(`Failed to start server`);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception');
  closeGracefully('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  logger.fatal('Unhandled rejection');
  closeGracefully('unhandledRejection');
});

// Start the server
start(); 