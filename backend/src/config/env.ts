import dotenv from 'dotenv';

dotenv.config();

// Environment validation function
function validateRequiredEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Validate critical secrets in production
function validateSecrets() {
  if (process.env.NODE_ENV === 'production') {
    validateRequiredEnvVar('JWT_SECRET', process.env.JWT_SECRET);
    validateRequiredEnvVar('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);
    validateRequiredEnvVar('DB_PASSWORD', process.env.DB_PASSWORD);
  }
}

// Run validation
validateSecrets();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || (process.env.NODE_ENV === 'production' ? 
      (() => { throw new Error('DB_PASSWORD is required in production'); })() : 
      'postgres'),
    database: process.env.DB_NAME || 'ecommerce',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? 
      (() => { throw new Error('JWT_SECRET is required in production'); })() : 
      'dev-jwt-secret-key-change-in-production'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? 
      (() => { throw new Error('JWT_REFRESH_SECRET is required in production'); })() : 
      'dev-jwt-refresh-secret-key-change-in-production'),
    expiresIn: '24h',
    refreshExpiresIn: '7d',
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || (process.env.NODE_ENV === 'production' ? 
      (() => { throw new Error('STRIPE_SECRET_KEY is required in production'); })() : 
      undefined),
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || (process.env.NODE_ENV === 'production' ? 
      (() => { throw new Error('STRIPE_WEBHOOK_SECRET is required in production'); })() : 
      undefined),
  },
  
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || (process.env.NODE_ENV === 'production' ? 
      (() => { throw new Error('SMTP_USER is required in production'); })() : 
      undefined),
    pass: process.env.SMTP_PASS || (process.env.NODE_ENV === 'production' ? 
      (() => { throw new Error('SMTP_PASS is required in production'); })() : 
      undefined),
  },
  
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3100',
      'http://localhost:3101',
    ],
  },
  
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  },
  
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadDir: 'uploads',
  },
  
  app: {
    name: 'E-commerce API',
    version: '1.0.0',
  },
} as const;

export type Config = typeof config; 