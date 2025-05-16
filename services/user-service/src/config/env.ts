import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
config();

// Environment variables schema
const envSchema = z.object({
  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3002),
  DATABASE_URL: z.string().url().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  JWT_SECRET: z.string().min(32).default('your-jwt-secret-key-minimum-32-chars-long'),
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

// TypeScript type for the config
export type Env = z.infer<typeof envSchema>;

// Export individual config values with types
export const {
  PORT,
  DATABASE_URL,
  NODE_ENV,
  LOG_LEVEL,
  JWT_SECRET,
} = env; 