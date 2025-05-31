import Fastify, { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';

import { config } from './config';
import { appLogger } from './utils/logger';
import { reviewRoutes } from './routes/review.routes';
import { moderationRoutes } from './routes/moderation.routes';
import { healthRoutes } from './routes/health.routes';

/**
 * Create Fastify application with configuration
 */
export function buildApp(): FastifyInstance {
  // Create Fastify instance with logging
  const app = Fastify({
    logger: false, // We use our own logger
    trustProxy: true
  });

  // Register plugins
  app.register(fastifyHelmet);
  
  // CORS configuration
  app.register(fastifyCors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  });
  
  // Rate limiting
  app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });
  
  // JWT authentication
  app.register(fastifyJwt, {
    secret: config.jwtSecret
  });
  
  // Swagger documentation
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Review Service API',
        description: 'API for managing product reviews',
        version: config.version
      },
      servers: [
        {
          url: `http://${config.host}:${config.port}`,
          description: config.nodeEnv
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  });
  
  app.register(fastifySwaggerUi, {
    routePrefix: '/documentation'
  });

  // Register routes
  app.register(healthRoutes);
  app.register(reviewRoutes);
  app.register(moderationRoutes);

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    appLogger.error({
      error: error.message,
      stack: error.stack,
      path: request.url,
      method: request.method
    }, 'Request error');
    
    reply.status(error.statusCode || 500).send({
      message: error.message || 'Internal Server Error',
      statusCode: error.statusCode || 500
    });
  });

  return app;
} 