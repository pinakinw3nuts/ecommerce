import { z } from 'zod';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env file if it exists
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Define validation schema for environment variables
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3014').transform(Number),
  
  // Redis configuration for queue
  REDIS_URL: z.string().url(),
  
  // Notification settings
  EMAIL_FROM: z.string().email(),
  NOTIFY_MODE: z.enum(['all', 'email', 'sms', 'none', 'log']).default('all'),
  
  // CORS configuration
  CORS_ORIGINS: z.string().default('http://localhost:3000').transform(val => 
    val.split(',').map(origin => origin.trim())
  ),
  
  // Authentication
  JWT_SECRET: z.string().min(10),
  
  // Email service providers (optional for initial setup)
  SENDGRID_API_KEY: z.string().optional(),
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  
  // SMS service providers (optional for initial setup)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Database
  DATABASE_URL: z.string().url(),
});

// Process environment variables
const env = envSchema.safeParse(process.env);

// Handle validation errors
if (!env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(env.error.format(), null, 2));
  process.exit(1);
}

// Create a typed config object
export const config = {
  nodeEnv: env.data.NODE_ENV,
  port: env.data.PORT,
  
  // Computed environment flags
  isDevelopment: env.data.NODE_ENV === 'development',
  isProduction: env.data.NODE_ENV === 'production',
  isTest: env.data.NODE_ENV === 'test',
  
  // Queue
  redisUrl: env.data.REDIS_URL,
  
  // Notification
  emailFrom: env.data.EMAIL_FROM,
  notifyMode: env.data.NOTIFY_MODE,
  
  // Security
  jwtSecret: env.data.JWT_SECRET,
  corsOrigins: env.data.CORS_ORIGINS,
  
  // Database
  databaseUrl: env.data.DATABASE_URL,
  
  // Email providers
  sendgrid: {
    apiKey: env.data.SENDGRID_API_KEY,
  },
  mailgun: {
    apiKey: env.data.MAILGUN_API_KEY,
    domain: env.data.MAILGUN_DOMAIN,
  },
  
  // SMS providers
  twilio: {
    accountSid: env.data.TWILIO_ACCOUNT_SID,
    authToken: env.data.TWILIO_AUTH_TOKEN,
    phoneNumber: env.data.TWILIO_PHONE_NUMBER,
  },
}; 