import { FastifyInstance, fastify } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from './config';
import { AppDataSource } from './database';
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
      logger: config.isProduction ? false : {
        level: config.logLevel,
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          }
        }
      }
    });

    try {
      // Initialize database connection
      await AppDataSource.initialize();
      logger.info('Database connection established successfully');
    } catch (error) {
      logger.error('Failed to initialize database connection', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }

    // Register plugins
    try {
      await app.register(helmet, {
        contentSecurityPolicy: config.isProduction
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
        origin: config.corsOrigins,
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
        const decoded = jwt.verify(token, config.jwtSecret) as JwtUser;
        
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

    // Register routes directly like in the order service
    try {
      await app.register(widgetRoutes, { prefix: '/api/v1/widget' });
      logger.debug('Widget routes registered successfully');
    } catch (error) {
      logger.error('Failed to register widget routes', {
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
        error: config.isProduction ? 'An unexpected error occurred' : (error instanceof Error ? error.message : 'Unknown error')
      });
    });

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