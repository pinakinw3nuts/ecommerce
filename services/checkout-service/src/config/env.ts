import { z } from 'zod';
import dotenv from 'dotenv';
import { join } from 'path';
import { configureLogger } from '../utils/logger';

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '../../.env') });

// Define environment schema with Zod
const envSchema = z.object({
  // Server configuration
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database configuration
  DATABASE_URL: z.string().url(),
  
  // Redis configuration
  REDIS_URL: z.string().url().optional(),

  // External API configurations
  TAX_API_URL: z.string().url(),

  // Service URLs for inter-service communication
  CART_SERVICE_URL: z.string().url(),
  USER_SERVICE_URL: z.string().url(),
  PRODUCT_SERVICE_URL: z.string().url(),

  // JWT configuration
  JWT_SECRET: z.string().min(1, 'JWT secret is required'),
});

// Parse and validate environment variables
const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error('❌ Invalid environment variables:');
  console.error(envParse.error.format());
  process.exit(1);
}

// Create the config object
export const config = {
  server: {
    port: envParse.data.PORT,
    nodeEnv: envParse.data.NODE_ENV,
  },
  database: {
    url: envParse.data.DATABASE_URL,
  },
  redis: {
    url: envParse.data.REDIS_URL,
  },
  services: {
    tax: envParse.data.TAX_API_URL,
    cart: envParse.data.CART_SERVICE_URL,
    user: envParse.data.USER_SERVICE_URL,
    product: envParse.data.PRODUCT_SERVICE_URL,
  },
  jwt: {
    secret: envParse.data.JWT_SECRET,
  },
  isDevelopment: envParse.data.NODE_ENV === 'development',
  isProduction: envParse.data.NODE_ENV === 'production',
  isTest: envParse.data.NODE_ENV === 'test',
} as const;

// Configure the logger with validated environment
const logger = configureLogger({
  isDevelopment: config.isDevelopment,
});

// Log loaded environment variables (hiding sensitive data)
const debugEnv = { ...process.env };
if (debugEnv.DATABASE_URL) debugEnv.DATABASE_URL = debugEnv.DATABASE_URL.replace(/:[^:@]+@/, ':***@');
if (debugEnv.JWT_SECRET) debugEnv.JWT_SECRET = '***';

logger.debug('Environment configuration loaded:', debugEnv);

// Export the config type
export type Config = typeof config; 