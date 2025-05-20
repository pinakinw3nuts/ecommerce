import { config } from './config/env';
import logger from './utils/logger';
import { buildApp } from './server';
import { swaggerUiOptions } from './config/swagger';

async function startServer() {
  try {
    const app = await buildApp();
    const port = config.server.port;
    const host = config.server.host;

    await app.listen({ port, host });
    
    const serverUrl = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
    const swaggerUrl = `${serverUrl}${swaggerUiOptions.routePrefix}`;
    
    logger.info(`Server is running on ${serverUrl}`);
    logger.info(`API Documentation available at ${swaggerUrl}`);
    
    // Also print to console for direct visibility
    console.log(`\n✅ Payment Service started successfully!`);
    console.log(`🌐 API Server: ${serverUrl}`);
    console.log(`📚 Swagger UI: ${swaggerUrl}\n`);
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.fatal(error, 'Unhandled rejection');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal(error, 'Uncaught exception');
  process.exit(1);
});

// Handle graceful shutdown
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, starting graceful shutdown`);
    process.exit(0);
  });
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
} 