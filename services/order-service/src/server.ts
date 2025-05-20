import { buildApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

async function startServer() {
  try {
    const app = await buildApp();

    await app.listen({
      port: config.port,
      host: '0.0.0.0'
    });

    logger.info(`🚀 Server listening on port ${config.port}`);
    logger.info(`📚 Swagger documentation available at http://localhost:${config.port}/documentation`);
    
    if (config.isDevelopment) {
      logger.info('Available routes:');
      app.printRoutes();
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 