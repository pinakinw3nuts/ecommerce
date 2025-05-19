import { AppDataSource } from '../src/config/database';
import { createLogger } from '../src/utils/logger';

const logger = createLogger('db-reset');

async function resetDatabase() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    logger.info('Database connection initialized');

    // Drop the database
    await AppDataSource.dropDatabase();
    logger.info('Dropped existing database');

    // Synchronize the schema
    await AppDataSource.synchronize();
    logger.info('Database schema synchronized');

    logger.info('Database reset completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error resetting database');
    process.exit(1);
  }
}

// Only run in development
if (process.env.NODE_ENV !== 'development') {
  logger.error('This script can only be run in development mode');
  process.exit(1);
}

resetDatabase(); 