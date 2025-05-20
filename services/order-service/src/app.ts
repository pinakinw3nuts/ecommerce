import fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { DataSource } from 'typeorm';
import { config } from './config';
import { orderRoutes } from './routes/order.routes';
import { noteRoutes } from './routes/note.routes';

// Create database connection
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  synchronize: config.isDevelopment,
  logging: config.isDevelopment,
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
});

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

  try {
    // Initialize database connection
    await AppDataSource.initialize();
    app.log.info('Database connection initialized');

    // Register plugins
    await app.register(fastifyCors, {
      origin: config.corsOrigins,
      credentials: true
    });

    await app.register(fastifyJwt, {
      secret: config.jwtSecret,
      sign: {
        expiresIn: '1d'
      }
    });

    // Register Swagger
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'Order Service API',
          description: 'API documentation for the Order Service',
          version: '1.0.0',
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: 'Local development server',
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
        security: [{ bearerAuth: [] }],
        tags: [
          { name: 'Orders', description: 'Order management endpoints' },
          { name: 'Notes', description: 'Order notes endpoints' },
          { name: 'Health', description: 'Health check endpoint' },
        ],
      },
    });

    await app.register(swaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
      staticCSP: true,
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
  } catch (error) {
    console.error('Error during app initialization:', error);
    throw error;
  }
} 