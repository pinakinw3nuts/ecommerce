import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenvConfig();

// Define environment schema with Zod
const envSchema = z.object({
  // Server configuration
  PORT: z.string()
    .default('3001')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
      message: 'Port must be a valid number between 1 and 65535'
    }),

  // Database configuration
  DATABASE_URL: z.string({
    required_error: 'Database URL is required',
  }).url({
    message: 'Invalid database URL format',
  }),

  // JWT configuration
  JWT_SECRET: z.string({
    required_error: 'JWT secret is required',
  }).min(32, {
    message: 'JWT secret must be at least 32 characters long',
  }),

  JWT_REFRESH_SECRET: z.string({
    required_error: 'JWT refresh secret is required',
  }).min(32, {
    message: 'JWT refresh secret must be at least 32 characters long',
  }),

  TOKEN_EXPIRES_IN: z.string()
    .default('15m')
    .refine((val) => {
      const timeUnit = val.slice(-1);
      const timeValue = parseInt(val.slice(0, -1));
      return (
        !isNaN(timeValue) &&
        timeValue > 0 &&
        ['s', 'm', 'h', 'd'].includes(timeUnit)
      );
    }, {
      message: 'Token expiration must be a positive number followed by s, m, h, or d (e.g., 15m, 24h)',
    }),

  // OAuth configuration
  GOOGLE_CLIENT_ID: z.string({
    required_error: 'Google Client ID is required',
  }).min(1, {
    message: 'Google Client ID cannot be empty',
  }),

  GOOGLE_CLIENT_SECRET: z.string({
    required_error: 'Google Client Secret is required',
  }).min(1, {
    message: 'Google Client Secret cannot be empty',
  }),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .default('development'),

  // Optional: Refresh token configuration
  REFRESH_TOKEN_EXPIRES_IN: z.string()
    .default('7d')
    .refine((val) => {
      const timeUnit = val.slice(-1);
      const timeValue = parseInt(val.slice(0, -1));
      return (
        !isNaN(timeValue) &&
        timeValue > 0 &&
        ['s', 'm', 'h', 'd'].includes(timeUnit)
      );
    }, {
      message: 'Refresh token expiration must be a positive number followed by s, m, h, or d (e.g., 7d)',
    }),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export typed config object
export const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  },
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.TOKEN_EXPIRES_IN,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  },
  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

// Type declaration for the config object
export type Config = typeof config;

// Export individual config sections for convenience
export const {
  server,
  database,
  jwt,
  oauth,
  isDevelopment,
  isProduction,
  isTest,
} = config; 