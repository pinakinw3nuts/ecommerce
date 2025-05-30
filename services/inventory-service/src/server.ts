// Register module aliases for development
import './utils/module-alias';

import { env } from '@config/env';
import { logger } from '@utils/logger';
import { initializeDataSource } from '@config/dataSource';
import { buildApp } from './app';

async function startServer() {
  try {
    // Initialize database connection
    logger.info('Initializing database connection...');
    await initializeDataSource();
    logger.info('Database connection established');

    // Build the Fastify app
    const app = await buildApp();

    // Start the server
    const port = env.PORT;
    const host = '0.0.0.0';
    
    await app.listen({ port, host });
    
    const address = app.server.address();
    const actualPort = typeof address === 'object' ? address?.port : port;
    
    logger.info(`✅ Server started successfully on port ${actualPort}`);
    logger.info(`📚 Documentation available at http://localhost:${actualPort}/documentation`);
    logger.info(`🔍 Health check available at http://localhost:${actualPort}/health`);

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down server...`);
      try {
        await app.close();
        logger.info('Server closed successfully');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during server shutdown');
        process.exit(1);
      }
    };

    // Register shutdown handlers
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return app;
  } catch (err) {
    logger.error({ err }, '❌ Failed to start server');
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for testing purposes
export { startServer }; 