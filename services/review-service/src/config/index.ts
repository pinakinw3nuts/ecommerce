import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define environment variable schema with validation
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3014'),
  HOST: z.string().default('localhost'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  VERSION: z.string().default('1.0.0'),
  
  // Database configuration
  DATABASE_URL: z.string(),
  
  // Auth configuration
  JWT_SECRET: z.string(),
  
  // CORS configuration
  CORS_ORIGINS: z.string().default('http://localhost:3000')
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export validated configuration
export const config = {
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  host: env.HOST,
  logLevel: env.LOG_LEVEL,
  version: env.VERSION,
  
  // Derived environment flags
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Database configuration
  databaseUrl: env.DATABASE_URL,
  
  // Auth configuration
  jwtSecret: env.JWT_SECRET,
  
  // CORS configuration
  corsOrigins: env.CORS_ORIGINS.split(',')
}; 