import dotenv from 'dotenv';
import { cleanEnv, str, num } from 'envalid';

// Load environment variables
dotenv.config();

export const config = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: num({ default: 3001 }),
  HOST: str({ default: '0.0.0.0' }),
  
  // Database
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: num({ default: 5432 }),
  DB_USERNAME: str(),
  DB_PASSWORD: str(),
  DB_DATABASE: str(),
  DB_SYNC: str({ default: 'false' }),
  DB_LOGGING: str({ default: 'false' }),

  // JWT
  JWT_SECRET: str(),
  JWT_EXPIRES_IN: str({ default: '15m' }),
  JWT_REFRESH_SECRET: str(),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),
  
  // Redis
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: num({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '' }),
  REDIS_DB: num({ default: 0 }),
  
  // CORS
  CORS_ORIGIN: str({ default: '*' }),
  
  // OAuth
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  
  // Email
  SMTP_HOST: str({ default: 'smtp.gmail.com' }),
  SMTP_PORT: num({ default: 587 }),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  SMTP_FROM: str({ default: 'noreply@example.com' })
});

// Export typed configuration
export const configTyped = {
  env: config.NODE_ENV,
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production',
  port: config.PORT,
  host: config.HOST,

  db: {
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USERNAME,
    password: config.DB_PASSWORD,
    database: config.DB_DATABASE,
    synchronize: config.DB_SYNC === 'true',
    logging: config.DB_LOGGING === 'true',
    url: `postgresql://${config.DB_USERNAME}:${config.DB_PASSWORD}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_DATABASE}`
  },

  jwt: {
    secret: config.JWT_SECRET,
    expiresIn: config.JWT_EXPIRES_IN,
    refreshSecret: config.JWT_REFRESH_SECRET,
    refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN
  },

  cors: {
    origin: config.CORS_ORIGIN
  },

  oauth: {
    google: {
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET
    }
  },

  redis: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB
  },

  smtp: {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS
    },
    from: config.SMTP_FROM
  }
} as const;

// Type declaration for the config object
export type Config = typeof configTyped;

// Export individual config sections for convenience
export const {
  env,
  isDevelopment,
  isProduction,
  port,
  host,
  db,
  jwt,
  cors,
  oauth,
  redis,
  smtp,
} = configTyped; 