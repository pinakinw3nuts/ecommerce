import { z } from 'zod';

// Define Config interface
export interface Config {
  port: number;
  environment: string;
  isDevelopment: boolean;
  isTest: boolean;
  isProduction: boolean;
  redisUrl: string;
  jwtSecret: string;
  serviceTokens: string[];
  emailFrom: string;
  notifyMode: string;
  corsOrigins: string[] | "*";
  email?: EmailConfig;
  notification?: {
    maxRetries?: number;
    baseRetryDelay?: number;
    retryStrategy?: string;
  };
  sendgrid?: {
    apiKey: string;
  };
}

// Email configuration
export interface EmailConfig {
  from?: string;
  transport?: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    }
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  webhookSecret?: string;
}

// Environment validation schema
const envSchema = z.object({
  // Server configuration
  PORT: z.string().transform(Number).default('3014'),
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  
  // Redis configuration
  REDIS_URL: z.string().url().optional().default('redis://localhost:6379'),
  
  // Authentication
  JWT_SECRET: z.string().min(16).optional().default('development-jwt-secret-key-minimum-16-chars'),
  SERVICE_TOKENS: z.string().optional().transform(val => 
    val ? val.split(',').map(token => token.trim()) : ['dev-service-token']
  ),
  
  // Notification configuration
  EMAIL_FROM: z.string().email().optional().default('noreply@example.com'),
  NOTIFY_MODE: z.enum(['log', 'email', 'sms', 'all']).default('log'),
  
  // CORS configuration
  CORS_ORIGINS: z.string().default('*').transform(val => 
    val === '*' ? '*' : val.split(',').map(origin => origin.trim())
  ),
}).refine(data => {
  // In production, all these fields are required
  if (data.NODE_ENV === 'production') {
    return !!data.REDIS_URL && !!data.JWT_SECRET && !!data.EMAIL_FROM;
  }
  return true;
}, {
  message: "REDIS_URL, JWT_SECRET, and EMAIL_FROM are required in production mode",
  path: ["NODE_ENV"]
});

// Extract and validate environment variables
const env = envSchema.parse(process.env);

// Configuration object
const config: Config = {
  port: env.PORT,
  environment: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  isProduction: env.NODE_ENV === 'production',
  
  redisUrl: env.REDIS_URL,
  
  jwtSecret: env.JWT_SECRET,
  serviceTokens: env.SERVICE_TOKENS,
  
  emailFrom: env.EMAIL_FROM,
  notifyMode: env.NOTIFY_MODE,
  
  corsOrigins: env.CORS_ORIGINS,
  
  // Email configuration
  email: {
    from: process.env.EMAIL_FROM,
    transport: process.env.EMAIL_TRANSPORT,
    // SMTP configuration
    smtp: process.env.SMTP_HOST ? {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    } : undefined,
    // SendGrid configuration
    sendgrid: process.env.SENDGRID_API_KEY ? {
      apiKey: process.env.SENDGRID_API_KEY
    } : undefined,
    // Mailgun configuration
    mailgun: process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN ? {
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    } : undefined,
    // Webhook secret for validating callbacks
    webhookSecret: process.env.EMAIL_WEBHOOK_SECRET
  },
  notification: {
    maxRetries: process.env.NOTIFICATION_MAX_RETRIES ? parseInt(process.env.NOTIFICATION_MAX_RETRIES, 10) : undefined,
    baseRetryDelay: process.env.NOTIFICATION_BASE_RETRY_DELAY ? parseInt(process.env.NOTIFICATION_BASE_RETRY_DELAY, 10) : undefined,
    retryStrategy: process.env.NOTIFICATION_RETRY_STRATEGY
  },
  sendgrid: process.env.SENDGRID_API_KEY ? {
    apiKey: process.env.SENDGRID_API_KEY
  } : undefined
};

// Export the environment schema for other modules
export type ConfigSchema = z.infer<typeof envSchema>;

// Export the config
export { config }; 