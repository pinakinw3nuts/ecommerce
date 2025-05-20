import fastify, { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import { TypeormPlugin } from './plugins/typeorm';
import { swaggerConfig, swaggerUiOptions } from './config/swagger';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { CouponService } from './services/coupon.service';
import { CheckoutService } from './services/checkout.service';
import { ShippingService } from './services/shipping.service';
import { Coupon } from './entities/Coupon';
import { CheckoutSession } from './entities/CheckoutSession';
import adminCouponRoutes from './routes/admin/coupon.routes';
import checkoutRoutes from './routes/checkout.routes';
import { config } from './config/env';
import { authGuard } from './middleware/auth.guard';

// Configure Fastify Instance
export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: config.isDevelopment ? 'debug' : 'info'
    }
  });

  // Register env config
  await app.register(fastifyEnv, {
    schema: {
      type: 'object',
      required: ['DATABASE_URL', 'JWT_SECRET'],
      properties: {
        DATABASE_URL: { type: 'string' },
        JWT_SECRET: { type: 'string' }
      }
    },
    dotenv: true
  });

  // Register rate limiter
  await app.register(fastifyRateLimit, {
    max: 100, // max 100 requests
    timeWindow: '1 minute', // per 1 minute
    allowList: ['127.0.0.1'], // exclude localhost
    redis: config.redis?.url ? {
      url: config.redis.url
    } : undefined
  });

  // Register CORS
  await app.register(fastifyCors, {
    origin: true,
    credentials: true
  });

  // Register Swagger
  await app.register(fastifySwagger, swaggerConfig);
  await app.register(fastifySwaggerUi, swaggerUiOptions);

  // Add health check route before any auth
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

  // Register JWT authentication
  await app.register(fastifyJwt, {
    secret: config.jwt.secret
  });

  // Register TypeORM plugin
  await app.register(TypeormPlugin);

  // Initialize services
  const couponService = new CouponService(app.typeorm.getRepository(Coupon));
  const shippingService = new ShippingService();
  const checkoutService = new CheckoutService(
    app.typeorm.getRepository(CheckoutSession),
    couponService,
    shippingService
  );

  // Register public routes
  await app.register(async (publicApp) => {
    // Register public checkout routes
    await publicApp.register(checkoutRoutes, { 
      prefix: '/checkout',
      checkoutService,
      couponService,
      shippingService
    });
  }, { prefix: '/api/v1' });

  // Register protected routes
  await app.register(async (protectedApp) => {
    // Add auth decorator to indicate protected context
    protectedApp.decorate('auth', true);
    
    // Add auth middleware
    protectedApp.addHook('preHandler', authGuard);
    
    // Register protected admin routes
    await protectedApp.register(adminCouponRoutes, { 
      prefix: '/admin/coupons',
      couponService 
    });
  }, { prefix: '/api/v1' });

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
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