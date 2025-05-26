import 'dotenv/config';
import { configTyped } from './config/env';
import logger from './utils/logger';
import { startServer } from './index';

const serverLogger = logger.child({ module: 'server' });

process.on('unhandledRejection', (error: Error) => {
  serverLogger.fatal(
    { err: error, eventType: 'unhandledRejection' },
    'Fatal: Unhandled Promise Rejection'
  );
  // Give logger time to flush
  setTimeout(() => process.exit(1), 500);
});

process.on('uncaughtException', (error: Error) => {
  serverLogger.fatal(
    { err: error, eventType: 'uncaughtException' },
    'Fatal: Uncaught Exception'
  );
  // Give logger time to flush
  setTimeout(() => process.exit(1), 500);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  try {
    serverLogger.info({ signal }, 'Received shutdown signal. Starting graceful shutdown...');
    
    // Add any cleanup tasks here (e.g., close database connections)
    
    serverLogger.info('Cleanup completed. Shutting down...');
    process.exit(0);
  } catch (error) {
    serverLogger.error(
      { err: error, signal },
      'Error during graceful shutdown'
    );
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the application
async function bootstrap() {
  try {
    // Log startup information
    serverLogger.info(
      {
        server: {
          nodeEnv: configTyped.env,
          port: configTyped.port,
          isDevelopment: configTyped.isDevelopment,
          isProduction: configTyped.isProduction
        },
        nodeEnv: configTyped.env
      },
      'Starting Auth Service...'
    );

    // Start the server
    await startServer();

    // Log successful startup
    serverLogger.info(
      {
        info: {
          address: `http://localhost:${configTyped.port}`,
          docs: `http://localhost:${configTyped.port}/docs`,
          nodeEnv: configTyped.env
        },
        nodeEnv: configTyped.env
      },
      'Auth Service is ready'
    );
  } catch (error) {
    serverLogger.fatal(
      { err: error },
      'Fatal error during service startup'
    );
    
    // Give logger time to flush
    setTimeout(() => process.exit(1), 500);
  }
}

// Bootstrap the application
bootstrap(); 