import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { join } from 'path';

// Load environment variables from .env file
const result = dotenv.config({ 
  path: join(process.cwd(), '.env') 
});

if (result.error) {
  logger.warn('Could not load .env file:', result.error.message);
  logger.info('Using environment variables from process');
}

// Debug log environment variables
logger.info('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
});

// Configuration schema
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val || '3006')),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_USERNAME: z.string().default('postgres'),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().default('order_db'),
  DATABASE_URL: z.string().url().optional(),
  
  // Authentication
  JWT_SECRET: z.string().default('default-jwt-secret-change-in-production'),
  
  // CORS
  CORS_ORIGINS: z.string()
    .transform(origins => origins.split(',').map(o => o.trim()))
    .default('http://localhost:3100'),
  
  // Service URLs
  CHECKOUT_SERVICE_URL: z.string().url().default('http://localhost:3005'),
  PRODUCT_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:3007'),
});

// Parse and validate configuration
const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error('Invalid configuration:', parsed.error.toString());
  
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  
  logger.warn('Using default configuration values due to validation errors');
}

// Define config type
export interface Config {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  jwt: {
    secret: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password?: string;
    name: string;
    url?: string;
  };
  corsOrigins: string[];
  services: {
    checkout: string;
    product: string;
    notification: string;
  };
}

// Export validated config
export const config: Config = {
  nodeEnv: parsed.success ? parsed.data.NODE_ENV : 'development',
  port: parsed.success ? parsed.data.PORT : 3006,
  isDevelopment: parsed.success ? parsed.data.NODE_ENV === 'development' : true,
  isProduction: parsed.success ? parsed.data.NODE_ENV === 'production' : false,
  isTest: parsed.success ? parsed.data.NODE_ENV === 'test' : false,
  
  jwt: {
    secret: parsed.success ? parsed.data.JWT_SECRET : 'default-jwt-secret-change-in-production',
  },
  
  database: {
    host: parsed.success ? parsed.data.DB_HOST : 'localhost',
    port: parsed.success ? parseInt(parsed.data.DB_PORT) : 5432,
    username: parsed.success ? parsed.data.DB_USERNAME : 'postgres',
    password: parsed.success ? parsed.data.DB_PASSWORD : undefined,
    name: parsed.success ? parsed.data.DB_NAME : 'order_db',
    url: parsed.success ? parsed.data.DATABASE_URL : undefined,
  },
  
  corsOrigins: parsed.success ? parsed.data.CORS_ORIGINS : ['http://localhost:3100'],
  
  services: {
    checkout: parsed.success ? parsed.data.CHECKOUT_SERVICE_URL : 'http://localhost:3005',
    product: parsed.success ? parsed.data.PRODUCT_SERVICE_URL : 'http://localhost:3003',
    notification: parsed.success ? parsed.data.NOTIFICATION_SERVICE_URL : 'http://localhost:3007',
  },
}; 