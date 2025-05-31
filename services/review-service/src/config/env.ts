import { z } from 'zod';
import dotenv from 'dotenv';
import { appLogger as logger } from '../utils/logger';

// Load environment variables from .env file
dotenv.config();

// Define schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  CORS_ORIGINS: z.string().default('*'),
});

// Parse and validate environment variables
const _env = envSchema.safeParse(process.env);

// Handle validation errors
if (!_env.success) {
  logger.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

// Create validated config object
export const env = _env.data;

// Derived config values
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  corsOrigins: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
}; 