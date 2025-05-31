import fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { FastifyRequest, FastifyReply, FastifyError, FastifyInstance } from 'fastify';

import { env } from './config/env';
import logger from './utils/logger';
import { companyRoutes } from './routes/company.routes';
import { companyUserRoutes } from './routes/companyUser.routes';
import { creditRoutes } from './routes/credit.routes';
import { billingRoutes } from './routes/billing.routes';
import { authGuard } from './middlewares/authGuard';
import { initializeDataSource } from './config/dataSource';
import { databasePlugin } from './plugins/database';

// Use explicit any for better TS compatibility with custom logger
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FastifyApp = any;

/**
 * Builds and configures the Fastify application
 */
export async function buildApp() {
  // Initialize database connection
  try {
    await initializeDataSource();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to initialize database connection', error);
    throw error;
  }

  // Create Fastify instance with logger configuration
  const app = fastify({
    logger: true
  });

  // Register health check route
  app.get('/health', {
    schema: {
      tags: ['health'],
      summary: 'Health check endpoint',
      description: 'Returns the health status of the service',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: 'company-service' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async () => {
    return { status: 'ok', service: 'company-service', timestamp: new Date().toISOString() };
  });

  // Register plugins
  await registerPlugins(app);
  
  // Register routes
  await registerRoutes(app);
  
  // Register error handler
  registerErrorHandler(app);

  // Setup for handling circular references in JSON responses
  app.addHook('onSend', async (_request, _reply, payload) => {
    try {
      // Parse the string payload to an object
      const parsedPayload = JSON.parse(payload as string);
      
      // Handle circular references in response by converting to JSON with a custom replacer
      const seen = new WeakSet();
      return JSON.stringify(parsedPayload, (_k, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch (error) {
      // If parsing fails, return the original payload
      app.log.error('Error processing JSON payload:', error);
      return payload;
    }
  });

  return app;
}

/**
 * Register all needed Fastify plugins
 */
async function registerPlugins(app: FastifyApp): Promise<void> {
  // Register database plugin
  await app.register(databasePlugin);

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false
  });

  // CORS setup
  await app.register(cors, {
    origin: env.CORS_ORIGIN || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  });

  // JWT authentication
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: '24h'
    }
  });

  // Only register Swagger in development mode
  if (env.NODE_ENV === 'development') {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'Company Service API',
          description: 'API for managing B2B company accounts',
          version: '1.0.0'
        },
        servers: [
          {
            url: `http://localhost:${env.PORT}`,
            description: 'Development server'
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
        },
        tags: [
          { name: 'health', description: 'Health check endpoints' },
          { name: 'companies', description: 'Company management endpoints' },
          { name: 'users', description: 'Company user management endpoints' },
          { name: 'credit', description: 'Credit management endpoints' },
          { name: 'billing', description: 'Billing management endpoints' }
        ]
      }
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
        tryItOutEnabled: true
      },
      staticCSP: true,
      transformSpecification: (swaggerObject: Record<string, any>) => {
        return swaggerObject;
      },
      transformSpecificationClone: true
    });
  }
}

/**
 * Register all API routes
 */
async function registerRoutes(app: FastifyApp): Promise<void> {
  app.log.info('Registering public routes...');

  // Register routes with prefix
  await app.register(async (publicApp: FastifyInstance) => {
    await publicApp.register(companyRoutes, { prefix: '/companies' });
    await publicApp.register(companyUserRoutes, { prefix: '/company-users' });
    await publicApp.register(creditRoutes, { prefix: '/credit' });
    await publicApp.register(billingRoutes, { prefix: '/billing' });
    app.log.info('Public routes registered successfully');
  }, { prefix: '/api/v1' });

  app.log.info('Registering protected routes...');

  // Register protected routes with auth middleware (with admin prefix)
  await app.register(async (protectedApp: FastifyInstance) => {
    // Add auth decorator to indicate protected context
    protectedApp.decorate('auth', true);
    
    // Add auth middleware
    protectedApp.addHook('preHandler', authGuard);
    
    // Register protected routes with their specific prefixes
    await protectedApp.register(companyRoutes, { prefix: '/companies' });
    await protectedApp.register(companyUserRoutes, { prefix: '/company-users' });
    await protectedApp.register(creditRoutes, { prefix: '/credit' });
    await protectedApp.register(billingRoutes, { prefix: '/billing' });
    app.log.info('Protected routes registered successfully');
  }, { prefix: '/api/v1/admin' });

  // Not found handler
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    reply.status(404).send({
      success: false,
      message: `Route ${request.method}:${request.url} not found`,
      error: 'NOT_FOUND'
    });
  });
}

/**
 * Register global error handler
 */
function registerErrorHandler(app: FastifyApp): void {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode || 500;
    
    // Log the error
    logger.error({
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        id: request.id
      }
    }, 'Request error');
    
    // Handle JWT verification errors
    if (error.name === 'UnauthorizedError' || error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      return reply.status(401).send({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
    }
    
    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        details: error.validation
      });
    }
    
    // Send error response
    return reply.status(statusCode).send({
      success: false,
      error: error.code || 'SERVER_ERROR',
      message: statusCode === 500 && env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : error.message || 'Something went wrong'
    });
  });
}

// Export for testing
export default buildApp; 