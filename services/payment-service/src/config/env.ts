import dotenv from 'dotenv'
import { z } from 'zod'

// Load environment variables
dotenv.config()

// Environment variables schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3006'),
  HOST: z.string().default('0.0.0.0'),
  
  // Database
  DB_HOST: z.string(),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  
  // Razorpay
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('razorpay_webhook_secret_placeholder'),
  
  // PayPal
  PAYPAL_CLIENT_ID: z.string().default(''),
  PAYPAL_CLIENT_SECRET: z.string().default(''),
  PAYPAL_WEBHOOK_ID: z.string().default('paypal_webhook_id_placeholder'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  
  // JWT (for auth)
  JWT_SECRET: z.string()
})

// Parse and validate environment variables
const env = envSchema.parse(process.env)

// Export configuration object
export const config = {
  isProduction: env.NODE_ENV === 'production',
  server: {
    port: env.PORT,
    host: env.HOST
  },
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET
  },
  razorpay: {
    key: env.RAZORPAY_KEY_ID,
    secret: env.RAZORPAY_KEY_SECRET,
    webhookSecret: env.RAZORPAY_WEBHOOK_SECRET
  },
  paypal: {
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    webhookId: env.PAYPAL_WEBHOOK_ID
  },
  cors: {
    origin: env.CORS_ORIGIN
  },
  jwt: {
    secret: env.JWT_SECRET
  }
} as const

// Export type
export type Config = z.infer<typeof envSchema> 