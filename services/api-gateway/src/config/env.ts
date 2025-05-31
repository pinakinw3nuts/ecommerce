import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenvConfig();

// Define environment schema with Zod
const envSchema = z.object({
  // Server configuration
  PORT: z.string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
      message: 'Port must be a valid number between 1 and 65535'
    }),

  // Rate limiting configuration
  RATE_LIMIT_MAX: z.string()
    .default('100')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Rate limit max must be a positive number'
    }),

  RATE_LIMIT_WINDOW_MS: z.string()
    .default('900000') // 15 minutes in milliseconds
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Rate limit window must be a positive number'
    }),

  // Service URLs
  AUTH_SERVICE_URL: z.string().default('http://auth-service:3001'),
  USER_SERVICE_URL: z.string().default('http://user-service:3002'),
  PRODUCT_SERVICE_URL: z.string().default('http://product-service:3003'),
  CART_SERVICE_URL: z.string().default('http://cart-service:3004'),
  CHECKOUT_SERVICE_URL: z.string().default('http://checkout-service:3005'),
  ORDER_SERVICE_URL: z.string().default('http://order-service:3006'),
  PAYMENT_SERVICE_URL: z.string().default('http://payment-service:3007'),
  SHIPPING_SERVICE_URL: z.string().default('http://shipping-service:3008'),
  INVENTORY_SERVICE_URL: z.string().default('http://inventory-service:3009'),
  COMPANY_SERVICE_URL: z.string().default('http://company-service:3010'),
  PRICING_SERVICE_URL: z.string().default('http://pricing-service:3011'),
  ADMIN_SERVICE_URL: z.string().default('http://admin-service:3012'),

  // Redis configuration
  REDIS_URL: z.string().optional(),

  // CORS configuration
  CORS_ORIGINS: z.string().default('*'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Application version
  npm_package_version: z.string().default('1.0.0'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export typed config object
export const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    version: env.npm_package_version,
    cors: {
      origin: env.CORS_ORIGINS,
    },
  },
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  },
  services: {
    auth: env.AUTH_SERVICE_URL,
    user: env.USER_SERVICE_URL,
    product: env.PRODUCT_SERVICE_URL,
    cart: env.CART_SERVICE_URL,
    checkout: env.CHECKOUT_SERVICE_URL,
    order: env.ORDER_SERVICE_URL,
    payment: env.PAYMENT_SERVICE_URL,
    shipping: env.SHIPPING_SERVICE_URL,
    inventory: env.INVENTORY_SERVICE_URL,
    company: env.COMPANY_SERVICE_URL,
    pricing: env.PRICING_SERVICE_URL,
    admin: env.ADMIN_SERVICE_URL,
  },
  redis: {
    url: env.REDIS_URL,
    enabled: !!env.REDIS_URL,
  },
} as const;

// Type declaration for the config object
export type Config = typeof config; 