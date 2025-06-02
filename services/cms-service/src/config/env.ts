import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env file
config({
  path: path.resolve(process.cwd(), '.env')
});

const envSchema = z.object({
  PORT: z.coerce.number().default(3002),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  
  // Database
  DB_TYPE: z.string().default('postgres'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('cms'),
  DB_SYNCHRONIZE: z.string().transform(val => val === 'true').default('true'),
  DB_LOGGING: z.string().transform(val => val === 'true').default('true'),
  DB_SSL: z.string().transform(val => val === 'true').default('false'),
  
  // Authentication
  JWT_SECRET: z.string().default('your-secret-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  
  // CORS
  CORS_ORIGINS: z.string().default('*').transform(val => val.split(',')),
  
  // Storage
  STORAGE_PROVIDER: z.string().default('local'),
  STORAGE_BASE_PATH: z.string().default('./uploads'),
  
  // Content Settings
  DEFAULT_LOCALE: z.string().default('en'),
  SUPPORTED_LOCALES: z.string().default('en').transform(val => val.split(',')),
});

export const env = envSchema.parse(process.env); 