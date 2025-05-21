import { FastifyInstance } from 'fastify';
import { buildApp } from './app';
import { env } from './config/env';
import logger from './utils/logger';

// Server instance
let server: FastifyInstance;

// Graceful shutdown function
async function closeGracefully(signal: string) {
  logger.info(`Received signal to terminate: ${signal}`);
  
  try {
    if (server) {
      await server.close();
      logger.info('HTTP server closed');
    }
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error);
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
    logger.info(`🚀 Admin service running at http://localhost:${env.PORT}`);
    logger.info(`📚 Documentation available at http://localhost:${env.PORT}/documentation`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Error starting server: ${errorMessage}`);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception:', error);
  closeGracefully('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  logger.fatal('Unhandled rejection:', reason);
  closeGracefully('unhandledRejection');
});

// Start the server
start(); 