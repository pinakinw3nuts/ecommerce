import { DataSource } from 'typeorm';
import { env } from './env';
import logger from '../utils/logger';
import { AdminActivityLog } from '../entities/AdminActivityLog';
import path from 'path';

// Log the database connection details (sanitized)
const dbUrl = new URL(env.DATABASE_URL);
logger.info(`Connecting to database: postgresql://${dbUrl.username}:***@${dbUrl.hostname}:${dbUrl.port}${dbUrl.pathname}`);

// Create TypeORM data source
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  synchronize: env.NODE_ENV !== 'production', // Auto-sync schema in dev
  logging: env.NODE_ENV === 'development',
  entities: [
    AdminActivityLog,
    // Add other entities here
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});

// Initialize database connection
export async function initializeDatabase(): Promise<DataSource> {
  try {
    if (!AppDataSource.isInitialized) {
      logger.info('Initializing database connection...');
      await AppDataSource.initialize();
      logger.info('Database connection established successfully');
    }
    return AppDataSource;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error({
      msg: `Error connecting to database: ${errorMessage}`,
      error: {
        message: errorMessage,
        stack: errorStack
      }
    });
    
    // More helpful error message depending on the error
    if (errorMessage.includes('ECONNREFUSED')) {
      throw new Error(`Failed to connect to database: Connection refused. Make sure PostgreSQL is running at ${dbUrl.hostname}:${dbUrl.port}`);
    } else if (errorMessage.includes('password authentication failed')) {
      throw new Error(`Failed to connect to database: Authentication failed. Check database credentials.`);
    } else if (errorMessage.includes('does not exist')) {
      throw new Error(`Failed to connect to database: Database "${dbUrl.pathname.substring(1)}" does not exist. Please create it.`);
    } else {
      throw new Error(`Failed to connect to database: ${errorMessage}`);
    }
  }
} 