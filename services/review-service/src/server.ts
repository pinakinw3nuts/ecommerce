// Import required modules
import { buildApp } from './app';
import { config } from './config';
import { appLogger } from './utils/logger';
import { initializeDatabase } from './config/database';

/**
 * Start the server
 */
async function start() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Build the application
    const app = buildApp();
    
    // Start the server
    await app.listen({
      port: config.port,
      host: config.host === 'localhost' ? '0.0.0.0' : config.host
    });
    
    appLogger.info(`Server started on ${config.host}:${config.port}`);
    appLogger.info(`Documentation available at http://${config.host}:${config.port}/documentation`);
    
    // Log environment info
    appLogger.info({
      environment: config.nodeEnv,
      version: config.version,
    }, 'Server environment');
  } catch (err) {
    appLogger.fatal(err, 'Failed to start server');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  appLogger.error({ reason, promise }, 'Unhandled Rejection');
  // Don't exit the process here, let the global error handler deal with it
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  appLogger.fatal(error, 'Uncaught Exception');
  // Exit with error
  process.exit(1);
});

// Start the server
start(); 