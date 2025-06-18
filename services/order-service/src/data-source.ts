import { DataSource } from 'typeorm';
import { Order } from './entities/Order';
import { OrderNote } from './entities/OrderNote';
import { OrderItem } from './entities/OrderItem';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { 
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_USERNAME = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_NAME = 'order_db',
  NODE_ENV = 'development'
} = process.env;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT),
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  entities: [Order, OrderNote, OrderItem],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsRun: true,
  synchronize: true,
  logging: NODE_ENV === 'development',
  ssl: NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

export const initializeDatabase = async (retryAttempts = 5, retryDelay = 3000): Promise<boolean> => {
  let currentAttempt = 0;
  
  const attemptConnection = async (): Promise<boolean> => {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log('Database connection initialized successfully');
        
        // Run a simple query to verify connection works
        await AppDataSource.query('SELECT 1');
        console.log('Database connection verified with test query');
      }
      return true;
    } catch (error) {
      currentAttempt++;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Database connection attempt ${currentAttempt}/${retryAttempts} failed: ${errorMessage}`);
      
      // Check if we should retry
      if (currentAttempt < retryAttempts) {
        console.log(`Retrying database connection in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attemptConnection();
      }
      
      console.error(`Failed to connect to database after ${retryAttempts} attempts`);
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
      console.log('Database connection closed successfully');
    }
    return true;
  } catch (error) {
    console.error('Error closing database connection:', error);
    return false;
  }
} 