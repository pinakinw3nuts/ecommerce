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
  console.error('❌ Invalid environment variables:', JSON.stringify(envParse.error.format(), null, 4));
  process.exit(1);
}

// Export typed config
export const config = envParse.data;

// Export type for use in other files
export type Env = z.infer<typeof envSchema>; 