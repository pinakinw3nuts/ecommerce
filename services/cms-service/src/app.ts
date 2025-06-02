import { FastifyInstance, fastify } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { env } from './config/env';
import { logger } from './utils/logger';
import { contentRoutes } from './routes/content.routes';
import { widgetRoutes } from './routes/widget.routes';
import { JwtUser } from './types/fastify';

/**
 * Build and configure the Fastify application
 */
export async function buildApp(): Promise<FastifyInstance> {
  try {
    // Create Fastify instance
    const app = fastify({
      logger: env.NODE_ENV !== 'production' ? {
        level: env.LOG_LEVEL,
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          }
        }
      } : false
    });

    try {
      // Register plugins
      await app.register(helmet, {
        contentSecurityPolicy: env.NODE_ENV === 'production'
      });
      logger.debug('Helmet plugin registered successfully');
    } catch (error) {
      logger.error('Failed to register helmet plugin', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }

    try {
      await app.register(cors, {
        origin: env.CORS_ORIGINS,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true
      });
      logger.debug('CORS plugin registered successfully');
    } catch (error) {
      logger.error('Failed to register CORS plugin', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }

    // Add custom JWT authentication
    app.decorate('authenticate', async function(request: FastifyRequest, reply: FastifyReply) {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
          throw new Error('No authorization header');
        }
        
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUser;
        
        // Assign the decoded user to the request
        request.user = decoded;
      } catch (err) {
        reply.status(401).send({ 
          success: false,
          message: 'Unauthorized',
          error: err instanceof Error ? err.message : 'Authentication failed'
        });
      }
    });

    // Register Swagger documentation
    try {
      await app.register(swagger, {
        swagger: {
          info: {
            title: 'CMS Service API',
            description: 'API documentation for the CMS Service',
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
        routePrefix: '/documentation'
      });
      
      logger.debug('Swagger plugins registered successfully');
    } catch (error) {
      logger.error('Failed to register Swagger plugins', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }

    // Register public routes
    try {
      await app.register(async (publicApp) => {
        await publicApp.register(widgetRoutes, { prefix: '/widget' });
        logger.debug('Public widget routes registered successfully');
      }, { prefix: '/api/v1' });
    } catch (error) {
      logger.error('Failed to register public routes', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
    
    // Register protected admin routes
    try {
      await app.register(async (adminApp) => {
        // Add auth middleware to all admin routes
        adminApp.addHook('onRequest', async (request, reply) => {
          try {
            await app.authenticate(request, reply);
          } catch (err) {
            // Error is handled in the authenticate decorator
          }
        });
        
        // Register content routes
        await adminApp.register(contentRoutes);
      }, { prefix: '/api/v1/admin/content' });
      
      logger.debug('Admin content routes registered successfully');
    } catch (error) {
      logger.error('Failed to register admin content routes', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        details: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      });
      throw error;
    }

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
      logger.error('Unhandled error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path: request.url
      });
      
      reply.status(500).send({
        success: false,
        message: 'Internal Server Error',
        error: env.NODE_ENV !== 'production' ? (error instanceof Error ? error.message : 'Unknown error') : 'An unexpected error occurred'
      });
    });

    // Log all registered routes in development
    if (env.NODE_ENV !== 'production') {
      const routes = app.printRoutes();
      logger.debug(`Registered routes:\n${routes}`);
    }

    return app;
  } catch (error) {
    logger.error('Failed to build application', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    });
    throw error;
  }
} 