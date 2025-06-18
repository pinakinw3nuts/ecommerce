import { DataSource } from 'typeorm';
import { config } from './index';
import { Order } from '../entities/Order';
import { OrderNote } from '../entities/OrderNote';
import { OrderItem } from '../entities/OrderItem';
import { logger } from '../utils/logger';

// Get database configuration from environment or use defaults
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'order_db',
};

// Log database connection details (redact password)
logger.info('Database connection details:', {
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  database: dbConfig.database,
  // Don't log the password for security reasons
});

// Try to use DATABASE_URL if available, otherwise use individual params
const connectionOptions = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
    };

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...connectionOptions,
  entities: [Order, OrderNote, OrderItem],
  synchronize: !config.isProduction,
  logging: false,
  ssl: config.isProduction ? {
    rejectUnauthorized: false
  } : false,
  // Add options for better production stability
  connectTimeoutMS: 10000,
  maxQueryExecutionTime: 1000, // Log slow queries (>1000ms)
  cache: config.isProduction,
  // Enhanced connection options
  extra: {
    // Connection pool settings for better stability
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // How long a connection can remain idle before being closed
    connectionTimeoutMillis: 5000, // How long to wait for a connection to be established
  },
  poolSize: 10, // Default pool size
});

/**
 * Initialize the database connection with retry mechanism
 * @param retryAttempts Maximum number of retry attempts
 * @param retryDelay Delay between retries in milliseconds
 */
export async function initializeDatabase(retryAttempts = 5, retryDelay = 3000) {
  let currentAttempt = 0;
  
  // Log complete connection options for debugging
  logger.debug('Attempting database connection with config:', {
    type: 'postgres',
    host: connectionOptions.url ? 'Using URL' : connectionOptions.host,
    port: connectionOptions.url ? 'Using URL' : connectionOptions.port,
    database: connectionOptions.url ? 'Using URL' : connectionOptions.database,
    ssl: config.isProduction ? 'Enabled with rejectUnauthorized: false' : 'Disabled',
    synchronize: !config.isProduction
  });
  
  // Function to handle a single connection attempt
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
      
      // Enhanced error logging with more context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`Database connection attempt ${currentAttempt}/${retryAttempts} failed: ${errorMessage}`, {
        errorDetails: {
          message: errorMessage,
          stack: errorStack,
          name: error instanceof Error ? error.name : 'Unknown',
          code: (error as any)?.code, // Capture Postgres error code if available
          errno: (error as any)?.errno, // Capture system error code if available
          syscall: (error as any)?.syscall, // Capture system call if available
        },
        connectionDetails: {
          host: connectionOptions.url ? 'Using URL' : connectionOptions.host,
          port: connectionOptions.url ? 'Using URL' : connectionOptions.port,
          database: connectionOptions.url ? 'Using URL' : connectionOptions.database
        }
      });
      
      // Check if we should retry
      if (currentAttempt < retryAttempts) {
        logger.info(`Retrying database connection in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attemptConnection();
      }
      
      // All retries failed
      logger.error(`Failed to connect to database after ${retryAttempts} attempts`);
      
      // Provide guidance based on common error patterns
      if (errorMessage.includes('ECONNREFUSED')) {
        logger.error('CONNECTION REFUSED: The database server is not reachable. Make sure PostgreSQL is running and accessible.');
      } else if (errorMessage.includes('password authentication failed')) {
        logger.error('AUTHENTICATION FAILED: Check your database username and password.');
      } else if (errorMessage.includes('does not exist')) {
        logger.error('DATABASE NOT FOUND: The specified database does not exist. Create it first or check the name.');
      }
      
      return false;
    }
  };
  
  // Start connection process
  return await attemptConnection();
}

// Register a handler for database disconnection events
if (AppDataSource.isInitialized) {
  logger.info('Setting up database disconnect monitoring');
  
  // Handle cases where the connection is lost
  // This event depends on Postgres driver implementation
  // For other databases, the event name may be different
  const driver = AppDataSource.driver;
  if (driver && typeof driver.connect === 'function') {
    try {
      // @ts-ignore - accessing potentially private API
      if (driver.postgres && driver.postgres.on) {
        // @ts-ignore
        driver.postgres.on('error', async (err) => {
          logger.error('Database connection error detected:', err);
          
          if (!AppDataSource.isInitialized) {
            logger.info('Database disconnected, attempting to reconnect...');
            await initializeDatabase();
          }
        });
      }
    } catch (error) {
      logger.warn('Could not set up disconnect handler', error);
    }
  }
}

/**
 * Gracefully close the database connection
 */
export async function closeDatabase() {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed successfully');
    }
    return true;
  } catch (error) {
    logger.error('Error closing database connection:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return false;
  }
}