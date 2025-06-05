import { configTyped } from './config/env';
import logger from './utils/logger';
import createApp from './app';

// Variable to hold the app instance for testing/export
let app: Awaited<ReturnType<typeof createApp>> | null = null;

export async function startServer() {
  try {
    logger.info('Starting Auth Service...');
    
    app = await createApp();
    await app.listen({ 
      port: configTyped.port, 
      host: configTyped.host 
    });
    
    return app;
  } catch (error) {
    logger.error('Failed to start server');
    process.exit(1);
  }
}

// Export the app instance for testing
export { app };

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (_error) => {
  logger.fatal('Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (_error) => {
  logger.fatal('Uncaught exception');
  process.exit(1);
}); 