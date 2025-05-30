import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define schema for environment variables
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3009),
  
  // CORS
  CORS_ORIGINS: z.string().optional(),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_DATABASE: z.string().default('inventory_service'),
  
  // Authentication
  AUTH_ENABLED: z.coerce.boolean().default(true),
  JWT_SECRET: z.string().default('inventory-service-secret'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // Alerts
  ALERT_STOCK_THRESHOLD: z.coerce.number().default(5),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env); 