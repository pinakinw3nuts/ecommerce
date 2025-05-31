import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { config } from '../config';
import { dbLogger } from '../utils/logger';
import { Review } from '../entities/Review';
import { ProductRating } from '../entities/ProductRating';

// Log database connection details (without sensitive info)
dbLogger.info('Initializing database connection');

// Create TypeORM data source
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  entities: [Review, ProductRating],
  synchronize: config.isDevelopment, // Auto-create schema in development
  logging: config.isDevelopment,
  migrations: ['dist/migrations/*.js'],
  ssl: config.isProduction ? {
    rejectUnauthorized: false
  } : false
});

// Initialize database connection with error handling
export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      dbLogger.info('Database connection established successfully');
    }
  } catch (error) {
    dbLogger.error('Error during database initialization:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    throw error;
  }
};

/**
 * Get a repository for a specific entity
 */
export function getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
  return AppDataSource.getRepository<T>(entity);
} 