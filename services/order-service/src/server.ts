import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import { config, NODE_ENV } from './config/env';
import { AppDataSource } from './data-source';
import logger from './utils/logger';
import { orderRoutes } from './routes/order.routes';
import { noteRoutes } from './routes/note.routes';
import { publicOrderRoutes } from './routes/public-orders.routes';
import { orderCheckoutRoutes } from './routes/orders-checkout.routes';
import { OrderService } from './services/order.service';
import { authMiddleware, adminAuthMiddleware } from './middleware/auth.middleware';

interface ServerOptions {
  dataSource: typeof AppDataSource;
}

let app: FastifyInstance; // Global reference for graceful shutdown

export async function createServer(options: ServerOptions): Promise<FastifyInstance> {
  app = fastify({
    logger: logger as any,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true
      }
    }
  });

  // Register plugins
  await app.register(cors, {
    origin: config.corsOrigins || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  });
  
  // Register JWT plugin
  await app.register(jwt, {
    secret: config.jwt.secret
  });

  // Register Swagger plugins
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Order Service API',
        description: 'API documentation for the Order Service',
        version: '1.0.0'
      },
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    }
  });
  
  await app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    }
  });

  // Add a redirect from / to /documentation
  app.get('/', (request, reply) => {
    reply.redirect('/documentation');
  });

  // Add database to app context
  app.decorate('db', options.dataSource);

  // Initialize services
  const orderService = new OrderService();

  // Register routes
  app.get('/health', async () => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: app.db?.isInitialized
    };
  });

  // Register public routes (no auth required)
  await app.register(async (publicApp) => {
    await publicApp.register(publicOrderRoutes, { prefix: '/public/orders' });
    await publicApp.register(orderCheckoutRoutes, { 
      prefix: '/checkout/orders',
      orderService
    });
  }, { prefix: '/api/v1' });

  // Register protected routes (auth required)
  await app.register(async (protectedApp) => {
    protectedApp.decorate('requireAuth', true);
    protectedApp.addHook('preHandler', authMiddleware);
    
    await protectedApp.register(orderRoutes, { prefix: '/orders' });
  }, { prefix: '/api/v1' });

  // Register admin-only routes
  await app.register(async (adminApp) => {
    adminApp.decorate('requireAdmin', true);
    adminApp.addHook('preHandler', adminAuthMiddleware);
    
    await adminApp.register(noteRoutes, { prefix: '/orders' });
  }, { prefix: '/api/v1/admin' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({
      err: error,
      request: {
        method: request.method,
        url: request.url,
        params: request.params,
        query: request.query
      }
    }, 'Request error occurred');

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: error.validation
      });
    }

    // Handle not found
    if (error.statusCode === 404) {
      return reply.status(404).send({
        message: 'Resource not found'
      });
    }

    // Handle unauthorized
    if (error.statusCode === 401) {
      return reply.status(401).send({
        message: 'Unauthorized'
      });
    }

    // Default error response
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Internal server error',
      error: NODE_ENV === 'development' ? error : undefined
    });
  });

  return app;
}

/**
 * Gracefully shutdown the server
 */
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  try {
    if (!app) {
      logger.info('No server instance to shutdown');
      process.exit(0);
      return;
    }

    // Close server first to stop accepting new requests
    await app.close();
    logger.info('Server closed');

    // Close database connection
    if (app.db?.isInitialized) {
      await app.db.destroy();
      logger.info('Database connection closed');
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    logger.error(err, 'Error during graceful shutdown');
    process.exit(1);
  }
}

const PORT = config.port || 3006;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    // Create a new AppDataSource instance to pass to the server
    const dataSource = AppDataSource;
    await dataSource.initialize();
    
    const app = await createServer({ dataSource });
    await app.listen({ port: Number(PORT), host: HOST });
    
    app.log.info(`Server is running on http://${HOST}:${PORT}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Add TypeScript type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    db: typeof AppDataSource;
  }
}

export { start };