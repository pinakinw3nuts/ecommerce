import { FastifyInstance, fastify } from 'fastify';
import { config } from './config';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { orderRoutes } from './routes/order.routes';
import { noteRoutes } from './routes/note.routes';
import { AppDataSource } from './config/database';

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
  await AppDataSource.initialize();

  // Register plugins
  await app.register(fastifyJwt, {
    secret: config.jwtSecret
  });

  await app.register(fastifyCors, {
    origin: config.corsOrigins
  });

  // Register Swagger
  await app.register(fastifySwagger, {
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

  // Register routes
  await app.register(orderRoutes, { prefix: '/api/orders' });
  await app.register(noteRoutes, { prefix: '/api/orders' });

  // Health check route
  app.get('/health', {
    schema: {
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(500).send({
      message: 'Internal Server Error',
      error: error.message
    });
  });

  return app;
} 