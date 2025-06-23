import 'reflect-metadata';
import { FastifyInstance, fastify } from 'fastify';
import { config } from './config/env';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { orderRoutes } from './routes/order.routes';
import { noteRoutes } from './routes/note.routes';
import { publicOrderRoutes } from './routes/public-orders.routes';
import { orderCheckoutRoutes } from './routes/orders-checkout.routes';
import { AppDataSource, initializeDatabase } from './data-source';
import { logger } from './utils/logger';
import { authMiddleware, adminAuthMiddleware } from './middleware/auth.middleware';
import { OrderService } from './services/order.service';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: config.isDevelopment ? 'debug' : 'info',
      transport: config.isDevelopment ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        }
      } : undefined
    }
  });

  // Initialize database connection
  const dbInitialized = await initializeDatabase();
  if (!dbInitialized) {
    app.log.warn('Database initialization failed, some features may not work correctly');
  }

  // Initialize services
  const orderService = new OrderService();

  // Register CORS
  const allowedOrigins = config.corsOrigins || [
    'http://localhost:3000', 
    'http://localhost:3100',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3100',
    'http://[::1]:3000',
    'http://[::1]:3100'
  ];
  app.log.info(`Setting up CORS with origins: ${JSON.stringify(allowedOrigins)}`);
  
  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return cb(null, true);
      
      // Allow localhost regardless of protocol or port in development
      if (config.isDevelopment && (
        origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://[::1]:')
      )) {
        return cb(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        cb(null, true);
        return;
      }
      
      app.log.warn(`CORS request rejected: ${origin} not in allowed origins`);
      cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Add a hook to log all incoming requests
  app.addHook('onRequest', (request, reply, done) => {
    app.log.debug(`Incoming ${request.method} request to ${request.url}`);
    if (request.headers.authorization) {
      app.log.debug(`Request has Authorization header: ${request.headers.authorization.substring(0, 15)}...`);
    } else {
      app.log.debug('Request has no Authorization header');
    }
    done();
  });

  // Register JWT authentication
  await app.register(fastifyJwt, {
    secret: config.jwt.secret
  });

  app.log.info(`Order Service JWT configured with secret: ${config.jwt.secret ? 'Provided' : 'Missing'}`);

  // Register Swagger
  await app.register(fastifySwagger, {
    mode: 'dynamic',
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

  await app.register(fastifySwaggerUi, {
    routePrefix: '/documentation'
  });

  // Health check endpoint (before any auth)
  app.get('/health', {
    schema: {
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            database: { type: 'boolean' },
            version: { type: 'string' }
          },
        },
      },
    },
  }, async () => {
    // Check database connection
    let dbStatus = false;
    try {
      dbStatus = AppDataSource.isInitialized;
    } catch (error) {
      app.log.error('Health check - database error', error);
    }
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      version: '1.0.0'
    };
  });

  // Register public routes (no auth required)
  await app.register(async (publicApp) => {
    // Register public order routes
    await publicApp.register(publicOrderRoutes, { prefix: '/public/orders' });
    await publicApp.register(orderCheckoutRoutes, { 
      prefix: '/checkout/orders',
      orderService  // Pass the required orderService parameter
    });
  }, { prefix: '/api/v1' });

  // Register protected routes (auth required)
  await app.register(async (protectedApp) => {
    // Add auth decorator and middleware
    protectedApp.decorate('requireAuth', true);
    protectedApp.addHook('preHandler', authMiddleware);
    
    // Register regular user auth routes
    await protectedApp.register(orderRoutes, { prefix: '/orders' });
  }, { prefix: '/api/v1' });

  // Register admin-only routes
  await app.register(async (adminApp) => {
    // Add admin auth decorator and middleware
    adminApp.decorate('requireAdmin', true);
    adminApp.addHook('preHandler', adminAuthMiddleware);
    
    // Register admin routes
    await adminApp.register(noteRoutes, { prefix: '/orders' });
  }, { prefix: '/api/v1/admin' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error(error);
    
    // Validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Validation Error',
        message: error.message,
        details: error.validation
      });
    }
    
    // Don't expose internal errors to client
    const message = config.isDevelopment ? error.message : 'Internal Server Error';
    const statusCode = error.statusCode || 500;
    
    reply.status(statusCode).send({
      success: false,
      error: message,
      statusCode
    });
  });

  return app;
}