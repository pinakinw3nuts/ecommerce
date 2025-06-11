import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyCorsOptions } from '@fastify/cors';
import cartRoutes from './routes/cart.routes';
import { AppDataSource } from './config/database';
import { swaggerConfig, swaggerUiOptions } from './config/swagger';

export async function buildServer(): Promise<FastifyInstance> {
  // Initialize Fastify with pino logger configuration
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
      name: 'cart-service'
    }
  });

  try {
    // Register CORS
    await server.register<FastifyCorsOptions>(cors, {
      origin: process.env.CORS_ORIGIN || true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    });

    // Register Swagger
    await server.register(swagger, swaggerConfig);
    await server.register(swaggerUi, swaggerUiOptions);

    // Health check endpoint
    server.get('/api/v1/health', {
      schema: {
        tags: ['system'],
        summary: 'Health check endpoint',
        description: 'Returns the health status of the service and its dependencies',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok'] },
              timestamp: { type: 'string', format: 'date-time' },
              services: {
                type: 'object',
                properties: {
                  database: { type: 'string', enum: ['up', 'down'] }
                }
              }
            }
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['error'] },
              timestamp: { type: 'string', format: 'date-time' },
              error: { type: 'string' }
            }
          }
        }
      }
    }, async (request, reply) => {
      try {
        // Check database connection
        const dbConnected = AppDataSource.isInitialized;
        
        return reply.code(200).send({
          status: 'ok',
          timestamp: new Date().toISOString(),
          services: {
            database: dbConnected ? 'up' : 'down',
          },
        });
      } catch (error) {
        request.log.error('Health check failed:', error);
        return reply.code(503).send({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Service unavailable',
        });
      }
    });

    // Register routes
    await server.register(cartRoutes, { prefix: '/api/v1' });

    // Global error handler
    server.setErrorHandler((error, _request, reply) => {
      server.log.error(error);
      
      const statusCode = error.statusCode || 500;
      const errorName = error.name || 'InternalServerError';
      const message = error.message || 'An internal server error occurred';
      
      // Format the error response according to our schema
      return reply.status(statusCode).send({
        error: errorName,
        message: message,
        statusCode: statusCode,
        details: error.validation || undefined
      });
    });

    return server;
  } catch (err) {
    server.log.error('Failed to build server:', err);
    throw err;
  }
}

export async function startServer(): Promise<FastifyInstance> {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const host = process.env.HOST || '0.0.0.0';

    const server = await buildServer();
    await server.listen({ port, host });
    server.log.info(`Server is running on ${host}:${port}`);
    server.log.info(`API documentation available at http://${host}:${port}/documentation`);
    return server;
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
} 