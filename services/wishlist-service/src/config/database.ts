import { DataSource } from 'typeorm';
import { config } from './index';
import { logger } from '../utils/logger';
import { Wishlist } from '../entities/Wishlist';

// We'll import entities once they're created
// import { Wishlist } from '../entities/Wishlist';
// import { WishlistItem } from '../entities/WishlistItem';

// Log database connection details (non-sensitive)
logger.info('Database connection details:', {
  databaseUrl: config.databaseUrl.replace(/\/\/.*?@/, '//***:***@'), // Hide credentials
});

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  synchronize: !config.isProduction, // Auto-create schema in dev/test
  logging: false,
  entities: [
    Wishlist
  ],
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
  ssl: config.isProduction ? {
    rejectUnauthorized: false
  } : false
});

// Note: We're not initializing the connection here
// The connection will be initialized in the app.ts file 