import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define schema for environment variables
const envSchema = z.object({
  PORT: z.string().default('3006').transform(Number),
  DATABASE_URL: z.string().default('postgresql://postgres:admin@123@localhost:5432/ecom'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('dev-secret-key-for-testing-only'),
});

// Validate environment variables
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

// Export validated environment variables
export const env = _env.data; 