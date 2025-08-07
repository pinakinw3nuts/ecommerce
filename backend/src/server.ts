import 'reflect-metadata';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
// import cookie from '@fastify/cookie';
import path from 'path';

import { config } from './config/env';
import { logger } from './utils/logger';
import { initializeDatabase } from './config/database';

// Import existing routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import checkoutRoutes from './routes/checkout';
import ordersRoutes from './routes/orders';
import usersRoutes from './routes/users';
import notificationRoutes from './routes/notification';
import inventoryRoutes from './routes/inventory';
// import { reviewRoutes } from './routes/review';
// import { shippingRoutes } from './routes/shipping';
// import { paymentRoutes } from './routes/payment';
// import { companyRoutes } from './routes/company';
// import { cmsRoutes } from './routes/cms';
// import { pricingRoutes } from './routes/pricing';
// import { wishlistRoutes } from './routes/wishlist';

// Import existing middleware
import { authMiddleware } from './middleware/auth';

export async function createServer() {
  // Initialize database
  await initializeDatabase();

  // Create Fastify instance
  const server = fastify({
    logger: logger as any,
    trustProxy: true,
  });

  // Register plugins
  await server.register(helmet);
  await server.register(cors, {
    origin: config.cors.origins,
    credentials: true,
  });
  await server.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
  });
  await server.register(multipart);
  await server.register(staticFiles, {
    root: path.join(__dirname, '../public'),
    prefix: '/public/',
  });
  await server.register(jwt, {
    secret: config.jwt.secret,
  });
  
  // await server.register(cookie);

  // Swagger documentation
  await server.register(swagger, {
    swagger: {
      info: {
        title: 'E-commerce API',
        description: 'Consolidated e-commerce backend API',
        version: '1.0.0',
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });
  await server.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Register middleware
  server.addHook('preHandler', authMiddleware);

  // Register routes
  await server.register(healthRoutes, { prefix: '/health' });
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(productRoutes, { prefix: '/api/products' });
  await server.register(usersRoutes, { prefix: '/api/users' });
  await server.register(cartRoutes, { prefix: '/api/cart' });
  await server.register(checkoutRoutes, { prefix: '/api/checkout' });
  await server.register(ordersRoutes, { prefix: '/api/orders' });
  await server.register(notificationRoutes, { prefix: '/api/notifications' });
  
  try {
    await server.register(inventoryRoutes, { prefix: '/api/inventory' });
    console.log('✅ Inventory routes registered successfully');
  } catch (error) {
    console.error('❌ Failed to register inventory routes:', error);
    throw error;
  }
  
  // await server.register(reviewRoutes, { prefix: '/api/reviews' });
  // await server.register(shippingRoutes, { prefix: '/api/shipping' });
  // await server.register(paymentRoutes, { prefix: '/api/payments' });
  // await server.register(companyRoutes, { prefix: '/api/companies' });
  // await server.register(cmsRoutes, { prefix: '/api/cms' });
  // await server.register(pricingRoutes, { prefix: '/api/pricing' });
  // await server.register(wishlistRoutes, { prefix: '/api/wishlist' });

  // Root route
  server.get('/', async (request, reply) => {
    return {
      message: 'E-commerce API',
      version: '1.0.0',
      docs: '/docs',
      health: '/health',
    };
  });

  return server;
}

export async function startServer() {
  try {
    const server = await createServer();

    // Start server
    await server.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    logger.info(`🚀 Server running on port ${config.port}`);
    logger.info(`📚 API Documentation: http://localhost:${config.port}/docs`);
    logger.info(`🏥 Health Check: http://localhost:${config.port}/health`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      await server.close();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
} 