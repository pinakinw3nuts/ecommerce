import fastify, { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { env } from '@config/env';
import { logger } from '@utils/logger';
import { registerInventoryRoutes } from '@routes/inventory.routes';
import { registerAlertRoutes } from '@routes/alert.routes';
import { healthRoutes } from '@routes/health.routes';

/**
 * Build and configure the Fastify application
 */
export async function buildApp(): Promise<any> {
  // Create Fastify instance
  const app = fastify({
    logger,
    trustProxy: true
  });

  // Register security plugins
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:']
      }
    }
  });

  await app.register(cors, {
    origin: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  });

  // Register JWT plugin
  await app.register(jwt, {
    secret: env.JWT_SECRET
  });

  // Add auth decorator if auth is enabled
  if (env.AUTH_ENABLED) {
    app.decorate('auth', true);
  }

  // Register Swagger documentation
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Inventory Service API',
        description: 'API for managing inventory in e-commerce platform',
        version: '1.0.0'
      },
      tags: [
        { name: 'inventory', description: 'Inventory endpoints' },
        { name: 'alerts', description: 'Inventory alerts endpoints' },
        { name: 'Health', description: 'Health check endpoints' }
      ],
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

  // Register routes
  await app.register(registerInventoryRoutes);
  await app.register(registerAlertRoutes);
  await app.register(healthRoutes);

  // Global error handler
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    logger.error({ error, path: request.url }, 'Unhandled error');
    
    reply.status(error.statusCode || 500).send({
      error: error.name || 'InternalServerError',
      message: error.message || 'An unexpected error occurred',
      statusCode: error.statusCode || 500
    });
  });

  return app;
} 