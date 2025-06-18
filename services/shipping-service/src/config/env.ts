import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define environment variable schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3008),
  API_PREFIX: z.string().default('/api/v1'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  
  // Database - support both naming conventions
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().optional(),
  DB_PASSWORD: z.string().default('postgres'),
  DB_DATABASE: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().default('your-super-secret-jwt-key-min-32-chars-here'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  
  // FedEx API credentials
  FEDEX_CLIENT_ID: z.string().default(''),
  FEDEX_CLIENT_SECRET: z.string().default(''),
  FEDEX_ACCOUNT_NUMBER: z.string().default(''),
  FEDEX_METER_NUMBER: z.string().default(''),
  
  // UPS API credentials
  UPS_CLIENT_ID: z.string().default(''),
  UPS_CLIENT_SECRET: z.string().default(''),
  UPS_ACCOUNT_NUMBER: z.string().default(''),
  
  // Default shipping origin address
  DEFAULT_ORIGIN_NAME: z.string().default('Warehouse'),
  DEFAULT_ORIGIN_ADDRESS_LINE1: z.string().default('123 Warehouse St'),
  DEFAULT_ORIGIN_CITY: z.string().default('New York'),
  DEFAULT_ORIGIN_STATE: z.string().default('NY'),
  DEFAULT_ORIGIN_POSTAL_CODE: z.string().default('10001'),
  DEFAULT_ORIGIN_COUNTRY: z.string().default('US'),
  DEFAULT_ORIGIN_PHONE: z.string().default('555-555-5555'),
  
  // Cache configuration
  CACHE_TTL: z.coerce.number().default(3600), // 1 hour in seconds
  
  // Rate comparison configuration
  DEFAULT_RATE_CRITERIA: z.enum(['price', 'time', 'value']).default('price')
})
.refine(
  data => data.DB_USERNAME !== undefined || data.DB_PASSWORD !== undefined,
  { message: "Either DB_USERNAME or DB_PASSWORD must be provided", path: ["DB_USERNAME"] }
)
.refine(
  data => data.DB_DATABASE !== undefined,
  { message: "DB_DATABASE must be provided", path: ["DB_DATABASE"] }
);

// Parse and validate environment variables
export const env = envSchema.parse({
  ...process.env,
  // Provide fallbacks if neither variable is defined
  DB_USERNAME: process.env.DB_USERNAME || process.env.DB_PASSWORD || 'postgres',
  DB_DATABASE: process.env.DB_DATABASE || process.env.DB_NAME || 'shipping_service'
});

// Create a type for the environment variables
export type Env = z.infer<typeof envSchema>;

// Export default for direct import
export default env; 