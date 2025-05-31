import { DataSource } from 'typeorm';
import { join } from 'path';
import { env } from './env';
import { logger } from '../utils/logger';
import { ShippingMethod } from '../entities/ShippingMethod';
import { ShippingZone } from '../entities/ShippingZone';
import { ShippingRate } from '../entities/ShippingRate';
import { Address } from '../entities/Address';

/**
 * TypeORM data source configuration
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  synchronize: env.NODE_ENV === 'development', // Auto-create database schema in development
  logging: env.NODE_ENV === 'development',
  entities: [
    ShippingMethod,
    ShippingZone,
    ShippingRate,
    Address,
    join(__dirname, '../entities/**/*.{ts,js}')
  ],
  migrations: [join(__dirname, '../migrations/**/*.{ts,js}')],
  subscribers: [join(__dirname, '../subscribers/**/*.{ts,js}')],
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize the data source
export const initializeDataSource = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connection established successfully');
    }
    return AppDataSource;
  } catch (error) {
    logger.error('Error during Data Source initialization', error);
    throw error;
  }
};

export default AppDataSource; 