import { DataSource } from 'typeorm';
import { config } from './env';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  synchronize: false, // Disable auto-synchronization
  dropSchema: false, // Disable auto-drop
  logging: false, // Disable query logging
  entities: [Cart, CartItem],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
  maxQueryExecutionTime: 1000, // Log slow queries
  logger: 'advanced-console',
});

// Initialize database connection with safe schema sync
const initializeDatabase = async () => {
  try {
    // First try to connect
    await AppDataSource.initialize();
    logger.info('Data Source has been initialized!');

    // If in development and RESET_DB is set, handle schema
    if (config.isDevelopment && process.env.RESET_DB === 'true') {
      try {
        // Drop schema if it exists
        await AppDataSource.dropDatabase();
        logger.info('Dropped existing database schema');

        // Sync schema
        await AppDataSource.synchronize();
        logger.info('Database schema synchronized');
      } catch (err) {
        logger.error({ err }, 'Error during schema synchronization');
        throw err;
      }
    } else if (config.isDevelopment) {
      // In development, but no reset requested, just sync schema
      try {
        await AppDataSource.synchronize();
        logger.info('Database schema synchronized');
      } catch (err) {
        logger.error({ err }, 'Error during schema synchronization');
        throw err;
      }
    }
  } catch (err) {
    logger.error({ err }, 'Error during Data Source initialization');
    throw err;
  }
};

// Export the initialization function
export { initializeDatabase }; 