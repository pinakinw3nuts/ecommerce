import fastify from 'fastify';
import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { DataSource } from 'typeorm';
import { configTyped } from './config/env';
import { registerAuthRoutes } from './routes/auth.routes';
import logger from './utils/logger';

// Create Fastify instance
const server = fastify({
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
  url: configTyped.db.url,
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: !configTyped.isProduction,
  logging: !configTyped.isProduction
});

// Error handler
server.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  const statusCode = error.statusCode || 500;
  
  logger.error({ 
    err: error,
    request: {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query
    }
  }, 'Request error');

  reply.status(statusCode).send({
    status: 'error',
    message: statusCode === 500 ? 'Internal Server Error' : error.message
  });
});

async function setupServer() {
  // Register plugins
  await server.register(cors, {
    origin: configTyped.cors.origin,
    credentials: true
  });

  await server.register(helmet);

  // Register Swagger
  await server.register(swagger, {
    swagger: {
      info: {
        title: 'Auth Service API',
        description: 'Authentication and Authorization Service API Documentation',
        version: '1.0.0'
      },
      host: `${configTyped.host}:${configTyped.port}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Authentication', description: 'Authentication related endpoints' },
        { name: 'Users', description: 'User management endpoints' }
      ]
    }
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    }
  });

  // Register routes
  await server.register(async (fastify) => {
    await registerAuthRoutes(fastify, dataSource);
  }, { prefix: '/api' });

  return server;
}

export async function startServer() {
  try {
    await dataSource.initialize();
    logger.info('Database connection established');
    
    const app = await setupServer();
    await app.listen({ 
      port: configTyped.port, 
      host: configTyped.host 
    });
    
    return app;
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server if this file is run directly
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