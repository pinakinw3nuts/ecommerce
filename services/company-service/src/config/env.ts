import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(process.cwd(), '.env') });

// Define schema for environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server settings
  PORT: z.string().transform(val => parseInt(val, 10)).default('3010'),
  HOST: z.string().default('0.0.0.0'),
  
  // CORS settings
  CORS_ORIGIN: z.string().optional(),
  
  // JWT authentication
  JWT_SECRET: z.string().min(32).default('supersecretkeythatneedstobechangedinproduction'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // Database connection
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(val => parseInt(val, 10)).default('5432'),
  DB_USERNAME: z.string().default('postgres'),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().default('company_service'),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  
  // External service URLs
  PRODUCT_SERVICE_URL: z.string().url().optional(),
  USER_SERVICE_URL: z.string().url().optional(),
  ORDER_SERVICE_URL: z.string().url().optional(),
  
  // Feature flags
  ENABLE_CREDIT_FEATURE: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ADVANCED_BILLING: z.string().transform(val => val === 'true').default('false')
});

// Function to validate environment variables
function validateEnv() {
  try {
    // Parse environment variables against schema
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);

      let errorMessage = 'Environment validation failed:\n';
      
      if (missingVars.length > 0) {
        errorMessage += `- Missing required variables: ${missingVars.join(', ')}\n`;
      }
      
      if (invalidVars.length > 0) {
        errorMessage += `- Invalid variables:\n  ${invalidVars.join('\n  ')}\n`;
      }
      
      console.error(errorMessage);
      process.exit(1);
    } else {
      console.error('Unknown error validating environment variables:', error);
      process.exit(1);
    }
  }
}

// Export validated environment variables
export const env = validateEnv(); 