import { DataSource } from 'typeorm';
import { Order } from './entities/Order';
import { OrderNote } from './entities/OrderNote';
import { OrderItem } from './entities/OrderItem';
import path from 'path';
import { config } from './config/env';
import { logger } from './utils/logger';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'order_db',
  entities: [Order, OrderNote, OrderItem],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsRun: true,
  synchronize: config.isDevelopment,
  logging: config.isDevelopment,
  ssl: config.isProduction ? {
    rejectUnauthorized: false
  } : false
});

export const initializeDatabase = async (retryAttempts = 5, retryDelay = 3000): Promise<boolean> => {
  let currentAttempt = 0;
  
  const attemptConnection = async (): Promise<boolean> => {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        logger.info('Database connection initialized successfully');
        
        // Run a simple query to verify connection works
        await AppDataSource.query('SELECT 1');
        logger.info('Database connection verified with test query');
      }
      return true;
    } catch (error) {
      currentAttempt++;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Database connection attempt ${currentAttempt}/${retryAttempts} failed: ${errorMessage}`);
      
      // Check if we should retry
      if (currentAttempt < retryAttempts) {
        logger.info(`Retrying database connection in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attemptConnection();
      }
      
      logger.error(`Failed to connect to database after ${retryAttempts} attempts`);
      return false;
    }
  };
  
  return await attemptConnection();
};

/**
 * Gracefully close the database connection
 */
export async function closeDatabase(): Promise<boolean> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed successfully');
    }
    return true;
  } catch (error) {
    logger.error('Error closing database connection:', error);
    return false;
  }
} 