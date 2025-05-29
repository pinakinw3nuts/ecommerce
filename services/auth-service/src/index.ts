import { configTyped } from './config/env';
import logger from './utils/logger';
import createApp from './app';

// Variable to hold the app instance for testing/export
let app: Awaited<ReturnType<typeof createApp>> | null = null;

export async function startServer() {
  try {
    logger.info({
      service: 'auth-service',
      version: '1.0.0',
      module: 'server',
      server: {
        nodeEnv: process.env.NODE_ENV,
        port: configTyped.port,
        isDevelopment: configTyped.isDevelopment,
        isProduction: configTyped.isProduction
      },
      nodeEnv: process.env.NODE_ENV
    }, 'Starting Auth Service...');
    
    app = await createApp();
    await app.listen({ 
      port: configTyped.port, 
      host: configTyped.host 
    });
    
    return app;
  } catch (error) {
    logger.error({ 
      service: 'auth-service',
      version: '1.0.0',
      err: error 
    }, 'Failed to start server');
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
process.on('unhandledRejection', (error) => {
  logger.fatal(error, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal(error, 'Uncaught exception');
  process.exit(1);
}); 