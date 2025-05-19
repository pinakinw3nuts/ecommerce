import 'dotenv/config';
import { AppDataSource, initializeDatabase } from './config/database';
import { startServer } from './server';
import { createLogger } from './utils/logger';

const logger = createLogger('app');

async function bootstrap() {
  try {
    // Initialize database connection with schema handling
    await initializeDatabase();
    logger.info('Database connection initialized');

    // Start the server
    const server = await startServer();

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        try {
          await server.close();
          await AppDataSource.destroy();
          logger.info('Server shut down gracefully');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Error during shutdown');
          process.exit(1);
        }
      });
    });

  } catch (err) {
    logger.error({ err }, 'Failed to start application');
    process.exit(1);
  }
}

// Start the application
bootstrap(); 