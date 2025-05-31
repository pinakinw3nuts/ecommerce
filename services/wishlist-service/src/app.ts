import { FastifyInstance, fastify } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { config } from './config';
import { AppDataSource } from './config/database';
import { wishlistRoutes } from './routes/wishlist.routes';
import { logger } from './utils/logger';
import { healthRoutes } from './routes/health.routes';

/**
 * Build and configure the Fastify application
 */
export async function buildApp(): Promise<FastifyInstance> {
  // Create Fastify instance with logging configuration
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
    logger.info('Database connection established');

    // Register JWT authentication plugin
    await app.register(fastifyJwt, {
      secret: config.jwtSecret
    });

    // Register CORS plugin
    await app.register(fastifyCors, {
      origin: config.corsOrigins
    });

    // Register Swagger documentation plugins
    await app.register(fastifySwagger, {
      swagger: {
        info: {
          title: 'Wishlist Service API',
          description: 'API documentation for the Wishlist Service',
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
    await app.register(wishlistRoutes, { prefix: '/api/wishlist' });
    
    // Register health routes
    await app.register(healthRoutes);

    // Global error handler
    app.setErrorHandler((error, request, reply) => {
      logger.error('Unhandled error:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        url: request.url,
        method: request.method
      });

      reply.status(500).send({
        message: 'Internal Server Error',
        error: config.isDevelopment ? error.message : 'An unexpected error occurred'
      });
    });

    return app;
  } catch (error) {
    logger.error('Failed to build application:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    throw error;
  }
} 