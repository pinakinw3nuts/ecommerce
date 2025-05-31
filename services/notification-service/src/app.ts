import { FastifyInstance, fastify } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { config } from './config';
import logger from './utils/logger';
import { initializeQueues } from './services/queueService';
import { healthRoutes } from './routes/health.routes';
import { notificationRoutes } from './routes/notification.routes';
import { testRoutes } from './routes/test.routes';
import { notificationLogRoutes } from './routes/notification-logs.routes';
import { serviceAuthGuard } from './middleware/serviceAuthGuard';
import { webhookRoutes } from './routes/webhook.routes';

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
    // Initialize queues
    try {
      await initializeQueues();
      logger.info('Queue system initialized');
    } catch (error) {
      if (config.isDevelopment) {
        logger.warn('Queue system initialization failed in development mode - continuing with limited functionality', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } else {
        throw error;
      }
    }

    // Register JWT authentication plugin
    await app.register(fastifyJwt, {
      secret: config.jwtSecret
    });

    // Register service auth guard globally - this checks for service tokens
    // before the JWT check happens in route-specific auth guards
    app.addHook('preHandler', serviceAuthGuard);

    // Register CORS plugin
    await app.register(fastifyCors, {
      origin: config.corsOrigins === '*' ? '*' : config.corsOrigins
    });

    // Register Swagger documentation plugins
    await app.register(fastifySwagger, {
      swagger: {
        info: {
          title: 'Notification Service API',
          description: 'API for sending and managing notifications',
          version: '1.0.0'
        },
        externalDocs: {
          url: 'https://swagger.io',
          description: 'Find more info here'
        },
        host: 'localhost:3014',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          },
          serviceAuth: {
            type: 'apiKey',
            name: 'X-Service-Token',
            in: 'header'
          }
        }
      }
    });

    await app.register(fastifySwaggerUi, {
      routePrefix: '/documentation'
    });

    // Register routes
    await app.register(notificationRoutes, { prefix: '/api/notifications' });
    await app.register(notificationLogRoutes, { prefix: '/api/notification-logs' });
    await app.register(webhookRoutes, { prefix: '/api/webhooks' });
    
    // Register health routes
    await app.register(healthRoutes);
    
    // Register test routes only in non-production environments
    if (config.isDevelopment || config.environment === 'test' || config.environment === 'staging') {
      logger.warn('Test routes enabled - these should not be exposed in production');
      await app.register(testRoutes, { prefix: '/api/test' });
    }

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