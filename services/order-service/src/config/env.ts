import { z } from 'zod';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '../../.env') });

// Define environment schema with Zod
const envSchema = z.object({
  // Server configuration
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database configuration
  DATABASE_URL: z.string().url(),

  // JWT configuration (for authentication)
  JWT_SECRET: z.string().min(1, 'JWT secret is required'),

  // Service URLs for inter-service communication
  CHECKOUT_SERVICE_URL: z.string().url(),
  PRODUCT_SERVICE_URL: z.string().url(),
  NOTIFICATION_SERVICE_URL: z.string().url().optional(),
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
  jwt: {
    secret: envParse.data.JWT_SECRET,
  },
  services: {
    checkout: envParse.data.CHECKOUT_SERVICE_URL,
    product: envParse.data.PRODUCT_SERVICE_URL,
    notification: envParse.data.NOTIFICATION_SERVICE_URL,
  },
  isDevelopment: envParse.data.NODE_ENV === 'development',
  isProduction: envParse.data.NODE_ENV === 'production',
  isTest: envParse.data.NODE_ENV === 'test',
} as const;

// Export the config type
export type Config = typeof config; 