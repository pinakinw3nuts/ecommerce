import { FastifyInstance, fastify } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { config } from './config';
import logger from './utils/logger';
import { healthRoutes } from './routes/health.routes';
import { notificationRoutes } from './routes/notification.routes';
import { notificationLogRoutes } from './routes/notification-logs.routes';
import { serviceAuthGuard } from './middleware/serviceAuthGuard';
import { webhookRoutes } from './routes/webhook.routes';

/**
 * Create and configure a Fastify instance
 */
function createFastifyInstance(): FastifyInstance {
  return fastify({
    logger: {
      level: config.isDevelopment ? 'debug' : 'info',
      transport: config.isDevelopment ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        }
      } : undefined
    },
    // Disable strict mode for schema validation to allow 'example' keyword
    ajv: {
      customOptions: {
        strict: false,
        strictSchema: false
      }
    },
    // Add reasonable timeout values
    connectionTimeout: 30000, // 30 seconds
    // Disable request logging to reduce noise during development
    disableRequestLogging: config.isDevelopment
  });
}

/**
 * Register core plugins with Fastify
 */
async function registerCorePlugins(app: FastifyInstance): Promise<void> {
  // Register JWT authentication plugin
  logger.debug('Registering JWT plugin...');
  await app.register(fastifyJwt, {
    secret: config.jwtSecret
  });
  logger.debug('JWT plugin registered successfully');

  // Register service auth guard globally
  logger.debug('Adding service auth guard...');
  app.addHook('preHandler', serviceAuthGuard);
  logger.debug('Service auth guard added successfully');

  // Register CORS plugin
  logger.debug('Registering CORS plugin...');
  await app.register(fastifyCors, {
    origin: config.corsOrigins === '*' ? '*' : config.corsOrigins
  });
  logger.debug('CORS plugin registered successfully');
}

/**
 * Register documentation plugins
 */
async function registerDocumentationPlugins(app: FastifyInstance): Promise<void> {
  // Register Swagger documentation plugins
  logger.debug('Registering Swagger plugins...');
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Notification Service API',
        description: 'API for sending and managing notifications',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://${process.platform === 'win32' ? 'localhost' : '0.0.0.0'}:${config.port}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          serviceAuth: {
            type: 'apiKey',
            name: 'X-Service-Token',
            in: 'header'
          }
        }
      }
    }
  });
  logger.debug('Swagger plugin registered successfully');

  logger.debug('Registering Swagger UI plugin...');
  await app.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    },
    uiHooks: {
      onRequest: function (request, reply, next) { next() },
      preHandler: function (request, reply, next) { next() }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });
  logger.debug('Swagger UI plugin registered successfully');
}

/**
 * Register route handlers
 */
async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Register health routes first (simplest route)
  logger.debug('Registering health routes...');
  await app.register(healthRoutes);
  logger.debug('Health routes registered successfully');
  
  // Register API routes
  try {
    logger.debug('Registering notification routes...');
    await app.register(notificationRoutes, { prefix: '/api/notifications' });
    logger.debug('Notification routes registered successfully');
  } catch (error) {
    logger.error('Failed to register notification routes', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
  
  try {
    logger.debug('Registering notification log routes...');
    await app.register(notificationLogRoutes, { prefix: '/api/notification-logs' });
    logger.debug('Notification log routes registered successfully');
  } catch (error) {
    logger.error('Failed to register notification log routes', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
  
  try {
    logger.debug('Registering webhook routes...');
    await app.register(webhookRoutes, { prefix: '/api/webhooks' });
    logger.debug('Webhook routes registered successfully');
  } catch (error) {
    logger.error('Failed to register webhook routes', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
  
  // Register test routes only in development or test environments
  if (config.isDevelopment || config.environment === 'test') {
    try {
      const { testRoutes } = await import('./routes/test.routes');
      logger.warn('Test routes enabled - these should not be exposed in production');
      logger.debug('Registering test routes...');
      await app.register(testRoutes, { prefix: '/api/test' });
      logger.debug('Test routes registered successfully');
    } catch (error) {
      logger.error('Failed to register test routes', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't fail the entire application if test routes can't be registered
      logger.warn('Continuing without test routes');
    }
  }
}

/**
 * Set up global error handler
 */
function setupErrorHandler(app: FastifyInstance): void {
  logger.debug('Setting up global error handler...');
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
  logger.debug('Global error handler set up successfully');
}

/**
 * Build and configure the Fastify application
 */
export async function buildApp(): Promise<FastifyInstance> {
  try {
    logger.debug('Creating Fastify instance...');
    const app = createFastifyInstance();
    
    // Set error handler early
    setupErrorHandler(app);
    
    logger.debug('Registering application plugins...');
    await registerCorePlugins(app);
    await registerDocumentationPlugins(app);
    await registerRoutes(app);

    logger.debug('Fastify application built successfully');
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