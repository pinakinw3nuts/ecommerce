import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Environment variables schema
const envSchema = z.object({
  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3006),
  DATABASE_URL: z.string().url().min(1).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  JWT_SECRET: z.string()
    .min(32, 'JWT secret must be at least 32 characters long')
    .refine(
      (val) => val !== 'your-jwt-secret-key-minimum-32-chars-long',
      'Please set a proper JWT secret in environment variables. It must match the auth service secret.'
    ),
  CORS_ORIGINS: z.string().default('http://localhost:3100'),
  CHECKOUT_SERVICE_URL: z.string().url().default('http://localhost:3005'),
  PRODUCT_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:3007'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => {
        return `${err.path.join('.')}: ${err.message}`;
      });
      console.error('❌ Invalid environment variables:', errorMessages);
      process.exit(1);
    }
    throw error;
  }
};

// Export validated config object
export const env = parseEnv();

// Export individual config values with types
export const {
  PORT,
  DATABASE_URL,
  NODE_ENV,
  LOG_LEVEL,
  JWT_SECRET,
  CORS_ORIGINS,
  CHECKOUT_SERVICE_URL,
  PRODUCT_SERVICE_URL,
  NOTIFICATION_SERVICE_URL
} = env;

// Derived config values
export const config = {
  port: PORT,
  nodeEnv: NODE_ENV,
  jwt: {
    secret: JWT_SECRET
  },
  isDevelopment: NODE_ENV === 'development',
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  corsOrigins: CORS_ORIGINS.split(',').map(url => url.trim()),
  services: {
    checkout: CHECKOUT_SERVICE_URL,
    product: PRODUCT_SERVICE_URL,
    notification: NOTIFICATION_SERVICE_URL
  }
}; 