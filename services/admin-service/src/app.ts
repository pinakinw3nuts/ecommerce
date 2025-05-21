import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
// import fastifyJwt from '@fastify/jwt'; // Temporarily comment out the problematic plugin
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { env } from './config/env';
import logger from './utils/logger';
import { AppDataSource, initializeDatabase } from './config/database';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/user.routes';
import moderationRoutes from './routes/moderation.routes';

// Create a dependency injection container
import { diContainer } from './di-container';

// Service imports
import { DashboardService } from './services/dashboard.service';
import { LogService } from './services/log.service';
import { UserModerationService } from './services/userModeration.service';

export async function buildApp(options: FastifyServerOptions = {}): Promise<FastifyInstance> {
  // Create Fastify instance with logger and type provider
  const app = Fastify(options).withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins
  app.register(fastifyCors, {
    origin: true, // can be configured more strictly in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
      },
    },
  });

  // Temporarily comment out JWT plugin
  // app.register(fastifyJwt, {
  //   secret: env.JWT_SECRET || 'super-secret', // Should be environment variable in real app
  // });

  // Setup Swagger documentation
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Admin Service API',
        description: 'API for e-commerce admin dashboard and user moderation',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  app.register(fastifySwaggerUI, {
    routePrefix: '/documentation',
  });

  // Setup DI container
  app.decorate('diContainer', diContainer);
  
  // Initialize database connection
  let dataSource;
  try {
    dataSource = await initializeDatabase();
    diContainer.register('dataSource', dataSource);
  } catch (error) {
    logger.error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
  
  // Register services
  const logService = new LogService(dataSource);
  diContainer.register('logService', logService);
  diContainer.register('dashboardService', new DashboardService(dataSource));
  diContainer.register('userModerationService', new UserModerationService(
    dataSource,
    logService
  ));

  // Register routes
  app.register(dashboardRoutes, { prefix: '/api/admin/dashboard' });
  app.register(userRoutes, { prefix: '/api/admin/users' });
  app.register(moderationRoutes, { prefix: '/api/admin/moderation' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({
      message: 'Unhandled error occurred',
      error: {
        message: error.message,
        stack: error.stack,
      },
      request: {
        method: request.method,
        url: request.url,
        params: request.params,
        query: request.query,
      },
    });

    // Don't expose internal errors to the client
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 
      ? 'Internal Server Error' 
      : error.message;

    reply.status(statusCode).send({
      success: false,
      message,
      ...(statusCode !== 500 && error.validation && { 
        errors: error.validation 
      }),
    });
  });

  // Health check route
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
} 