import { DataSource } from 'typeorm';
import { env } from './env';
import path from 'path';

// Define the entities and migrations paths
const entitiesPath = env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../entities/*.js')
  : path.join(__dirname, '../entities/*.ts');

const migrationsPath = env.NODE_ENV === 'production'
  ? path.join(__dirname, '../migrations/*.js')
  : path.join(__dirname, '../migrations/*.ts');

// Create and export the data source
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [entitiesPath],
  migrations: [migrationsPath],
  synchronize: env.NODE_ENV === 'development' && env.TYPEORM_SYNCHRONIZE === 'true',
  logging: env.TYPEORM_LOGGING === 'true',
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize the data source
export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established');
    }
    return AppDataSource;
  } catch (error) {
    console.error('Error initializing database connection:', error);
    throw error;
  }
}; 