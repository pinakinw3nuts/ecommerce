import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

/**
 * Application configuration
 */
export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  
  // Database
  database: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'cms',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true'
  },
  
  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  
  // File Storage
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    basePath: process.env.STORAGE_BASE_PATH || './uploads',
    s3: {
      bucket: process.env.S3_BUCKET || 'cms-uploads',
      region: process.env.S3_REGION || 'us-east-1',
      accessKey: process.env.S3_ACCESS_KEY || '',
      secretKey: process.env.S3_SECRET_KEY || ''
    }
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // 100 requests per windowMs
  },
  
  // Content Settings
  content: {
    defaultLocale: process.env.DEFAULT_LOCALE || 'en',
    supportedLocales: process.env.SUPPORTED_LOCALES?.split(',') || ['en'],
    maxHistoryItems: parseInt(process.env.MAX_HISTORY_ITEMS || '10', 10)
  }
}; 