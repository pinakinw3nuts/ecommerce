import fastify, { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { TypeormPlugin } from './plugins/typeorm';
import { SwaggerPlugin } from './plugins/swagger';
import { CouponService } from './services/coupon.service';
import { CheckoutService } from './services/checkout.service';
import { ShippingService } from './services/shipping.service';
import { Coupon } from './entities/Coupon';
import { CheckoutSession } from './entities/CheckoutSession';
import adminCouponRoutes from './routes/admin/coupon.routes';
import checkoutRoutes from './routes/checkout.routes';

// Environment variable schema
const schema = {
  type: 'object',
  required: ['PORT', 'DATABASE_URL', 'JWT_SECRET'],
  properties: {
    PORT: {
      type: 'number',
      default: 3000
    },
    DATABASE_URL: {
      type: 'string'
    },
    JWT_SECRET: {
      type: 'string'
    },
    NODE_ENV: {
      type: 'string',
      default: 'development'
    }
  }
};

// Configure Fastify Instance
export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
    }
  });

  // Register env config
  await app.register(fastifyEnv, {
    schema,
    dotenv: true
  });

  // Register plugins
  await app.register(fastifyCors, {
    origin: true,
    credentials: true
  });

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET as string
  });

  // Register Swagger documentation first
  await app.register(SwaggerPlugin);

  // Register custom TypeORM plugin
  await app.register(TypeormPlugin);

  // Initialize services
  const couponService = new CouponService(app.typeorm.getRepository(Coupon));
  const shippingService = new ShippingService();
  const checkoutService = new CheckoutService(
    app.typeorm.getRepository(CheckoutSession),
    couponService,
    shippingService
  );

  // Register routes
  await app.register(adminCouponRoutes, { prefix: '/api/admin/coupons', couponService });
  await app.register(checkoutRoutes, { prefix: '/api/checkout', checkoutService });

  // Add health check route
  app.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }));

  // Global error handler
  app.setErrorHandler((error, _, reply) => {
    app.log.error(error);
    
    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }

    // Handle known errors
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        success: false,
        error: error.name,
        message: error.message
      });
    }

    // Handle unknown errors
    return reply.status(500).send({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  });

  return app;
} 