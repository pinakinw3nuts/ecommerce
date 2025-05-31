import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define environment schema with Zod
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().positive().default(3011),
  HOST: z.string().default('0.0.0.0'),
  
  // Database configuration
  DATABASE_URL: z.string(),
  TYPEORM_ENTITIES: z.string().optional(),
  TYPEORM_MIGRATIONS: z.string().optional(),
  TYPEORM_MIGRATIONS_DIR: z.string().optional(),
  TYPEORM_SYNCHRONIZE: z.string().optional().default('false'),
  TYPEORM_LOGGING: z.string().optional().default('true'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // Authentication
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1d'),
  
  // Pricing configuration
  DEFAULT_CURRENCY: z.string().length(3).default('USD'),
  
  // External API configuration
  CURRENCY_API_URL: z.string().url().optional(),
  CURRENCY_API_KEY: z.string().optional(),
  CURRENCY_UPDATE_INTERVAL: z.coerce.number().positive().default(3600), // Default: 1 hour in seconds
  
  // Cache configuration
  CACHE_TTL: z.coerce.number().positive().default(3600), // Default: 1 hour
});

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(e => e.code === 'invalid_type' && e.received === 'undefined')
        .map(e => e.path.join('.'));
      
      const invalidVars = error.errors
        .filter(e => e.code !== 'invalid_type' || e.received !== 'undefined')
        .map(e => `${e.path.join('.')}: ${e.message}`);
      
      console.error('\n🔥 Environment validation failed:');
      
      if (missingVars.length > 0) {
        console.error('\n❌ Missing required variables:');
        missingVars.forEach(v => console.error(`   - ${v}`));
      }
      
      if (invalidVars.length > 0) {
        console.error('\n❌ Invalid variables:');
        invalidVars.forEach(v => console.error(`   - ${v}`));
      }
      
      console.error('\nPlease check your .env file or environment variables.\n');
      process.exit(1);
    }
    
    console.error('Unknown error validating environment variables:', error);
    process.exit(1);
  }
}

// Export validated environment variables
export const env = validateEnv();

// Export the schema for documentation
export const environmentSchema = envSchema; 