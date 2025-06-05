import 'dotenv/config';
import { configTyped } from './config/env';
import logger from './utils/logger';
import { startServer } from './index';

const serverLogger = logger.child({ module: 'server' });

process.on('unhandledRejection', (_error: Error) => {
  serverLogger.fatal(
    { eventType: 'unhandledRejection' },
    'Fatal: Unhandled Promise Rejection'
  );
  // Give logger time to flush
  setTimeout(() => process.exit(1), 500);
});

process.on('uncaughtException', (_error: Error) => {
  serverLogger.fatal(
    { eventType: 'uncaughtException' },
    'Fatal: Uncaught Exception'
  );
  // Give logger time to flush
  setTimeout(() => process.exit(1), 500);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  try {
    serverLogger.info({ signal }, 'Shutting down...');
    process.exit(0);
  } catch (error) {
    serverLogger.error({ signal }, 'Error during shutdown');
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the application
async function bootstrap() {
  try {
    // Start the server
    await startServer();

    // Log successful startup
    serverLogger.info(
      {
        address: `http://localhost:${configTyped.port}`,
        docs: `http://localhost:${configTyped.port}/docs`
      },
      'Auth Service is ready'
    );
  } catch (error) {
    serverLogger.fatal('Fatal error during service startup');
    
    // Give logger time to flush
    setTimeout(() => process.exit(1), 500);
  }
}

// Bootstrap the application
bootstrap(); 