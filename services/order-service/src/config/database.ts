import { DataSource } from 'typeorm';
import { config } from './index';
import { Order } from '../entities/Order';
import { OrderNote } from '../entities/OrderNote';
import { OrderItem } from '../entities/OrderItem';
import { logger } from '../utils/logger';

// Log database connection details
logger.info('Database connection details:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  database: process.env.DB_NAME
});

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ecom',
  entities: [Order, OrderNote, OrderItem],
  synchronize: !config.isProduction,
  logging: config.isDevelopment,
  ssl: config.isProduction ? {
    rejectUnauthorized: false
  } : false
});

// Add initialization error handling
AppDataSource.initialize()
  .then(() => {
    logger.info('Database connection initialized');
  })
  .catch(error => {
    logger.error('Error during Data Source initialization:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    process.exit(1);
  });