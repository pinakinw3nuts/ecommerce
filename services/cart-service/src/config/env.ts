import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define environment schema with Zod
const envSchema = z.object({
  // Server configuration
  PORT: z.string().default('3002'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database configuration
  DATABASE_URL: z.string()
    .default('postgresql://postgres:postgres@localhost:5432/ecom')
    .transform(url => url.trim()),

  // Redis configuration (disabled by default)
  REDIS_URL: z.string()
    .transform(url => url.trim())
    .optional(),

  // Product service integration
  PRODUCT_SERVICE_URL: z.string()
    .default('http://localhost:3000')
    .transform(url => url.trim()),

  // JWT configuration for auth
  JWT_SECRET: z.string()
    .default('development_secret_key_min_32_chars_long')
    .transform(secret => secret.trim()),
});

// Parse and validate environment variables
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(env.error.format(), null, 4));
  process.exit(1);
}

// Export typed config object
export const config = {
  port: parseInt(env.data.PORT, 10),
  nodeEnv: env.data.NODE_ENV,
  isDevelopment: env.data.NODE_ENV === 'development',
  isProduction: env.data.NODE_ENV === 'production',
  isTest: env.data.NODE_ENV === 'test',
  
  // Database
  databaseUrl: env.data.DATABASE_URL,
  
  // Redis (disabled by default)
  redisUrl: undefined,
  
  // Service integration
  productServiceUrl: env.data.PRODUCT_SERVICE_URL,
  
  // Auth
  jwtSecret: env.data.JWT_SECRET,
} as const;

// Type for the config object
export type Config = typeof config; 