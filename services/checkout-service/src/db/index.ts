import { DataSource } from 'typeorm';
import { config } from '../config/env';
import { CheckoutSession } from '../entities/CheckoutSession';
import { logger } from '../utils/logger';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.database.url,
  synchronize: false,
  logging: config.isDevelopment,
  entities: [CheckoutSession],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection initialized');
  } catch (error) {
    logger.error('Error initializing database connection:', error);
    throw error;
  }
}

export const db = AppDataSource.manager; 