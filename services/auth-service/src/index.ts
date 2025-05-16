import fastify, { FastifyError, FastifyBaseLogger, RawServerDefault } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { DataSource } from 'typeorm';
import { config } from './config/env';
import { registerAuthRoutes } from './routes/auth.routes';
import { registerUserRoutes } from './routes/user.routes';
import logger from './utils/logger';

// Create Fastify instance
const server = fastify<RawServerDefault, any, any, FastifyBaseLogger>({
  logger,
  trustProxy: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: true,
      useDefaults: true
    }
  }
});

// Initialize database connection
const dataSource = new DataSource({
  type: 'postgres',
  url: config.database.url,
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: !config.isProduction, // Only enable in development
  logging: !config.isProduction
});

export async function startServer() {
  try {
    // Register plugins
    await server.register(cors, {
      origin: !config.isProduction,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    });

    await server.register(helmet, {
      global: true,
      contentSecurityPolicy: config.isProduction
    });

    // Register Swagger documentation
    await server.register(swagger, {
      openapi: {
        info: {
          title: 'Auth Service API',
          description: 'Authentication and User Management API',
          version: '1.0.0'
        },
        servers: [
          {
            url: `http://localhost:${config.server.port}`,
            description: 'Local development server'
          }
        ],
        tags: [
          {
            name: 'Authentication',
            description: 'Authentication related endpoints'
          },
          {
            name: 'Users',
            description: 'User profile and management endpoints'
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

    await server.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true
      },
      staticCSP: true
    });

    // Connect to database
    await dataSource.initialize();
    logger.info('Database connection established');

    // Register routes after Swagger is initialized
    await registerAuthRoutes(server, dataSource);
    await registerUserRoutes(server, dataSource);

    // Register global error handler
    server.setErrorHandler((error: FastifyError, request, reply) => {
      const statusCode = error.statusCode || 500;
      
      // Log error details
      logger.error({
        err: error,
        statusCode,
        url: request.url,
        method: request.method
      }, 'Request error');

      // Don't expose internal errors to client
      const message = statusCode === 500 
        ? 'Internal Server Error'
        : error.message;

      reply.status(statusCode).send({
        status: 'error',
        message
      });
    });

    // Start the server
    const address = await server.listen({
      port: config.server.port,
      host: '0.0.0.0'
    });

    logger.info(`Server listening at ${address}`);
    return server;
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export server and data source for testing
export { server, dataSource };

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (error) => {
  logger.fatal(error, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal(error, 'Uncaught exception');
  process.exit(1);
}); 