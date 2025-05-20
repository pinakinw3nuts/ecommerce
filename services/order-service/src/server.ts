import { buildApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

async function startServer() {
  try {
    const app = await buildApp();
    const port = process.env.PORT || 3006;

    await app.listen({
      port: parseInt(port.toString()),
      host: '0.0.0.0'
    });

    logger.info(`🚀 Server listening on port ${port}`);
    logger.info(`📚 Swagger documentation available at http://localhost:${port}/documentation`);
    
    if (config.isDevelopment) {
      logger.info('Available routes:');
      app.printRoutes();
    }
  } catch (error) {
    logger.error('Failed to start server:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    process.exit(1);
  }
}

// Start the server
startServer();