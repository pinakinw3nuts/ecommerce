import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { NODE_ENV } from './config/env';
import { swaggerOptions, swaggerUiOptions } from './config/swagger';
import logger from './utils/logger';
import { User, Address, LoyaltyProgramEnrollment } from './entities';
import { UserService } from './services/user.service';
import { AddressService } from './services/address.service';
import { createUserRouter } from './routes/user.routes';
import { createAddressRouter } from './routes/address.routes';
import { healthRoutes } from './routes/health.routes';
import { CurrentUser } from './middlewares/auth';
import { AppDataSource } from './data-source';

interface ServerOptions {
  dataSource: typeof AppDataSource;
}

let app: FastifyInstance; // Global reference for graceful shutdown

export async function createServer(options: ServerOptions): Promise<FastifyInstance> {
  app = fastify({
    logger,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true
      }
    }
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: NODE_ENV === 'production'
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  });
  
  // Register JWT plugin
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key'
  });

  // Register Swagger plugins
  await app.register(swagger, swaggerOptions);
  await app.register(swaggerUi, swaggerUiOptions);

  // Add a redirect from / to /documentation
  app.get('/', (request, reply) => {
    reply.redirect('/documentation');
  });

  // Add database to app context
  app.decorate('db', options.dataSource);

  // Register routes
  await app.register(healthRoutes);
  await app.register(createUserRouter(new UserService(options.dataSource)), { prefix: '/api/v1' });
  await app.register(createAddressRouter(new AddressService(options.dataSource)), { prefix: '/api/v1' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({
      err: error,
      request: {
        method: request.method,
        url: request.url,
        params: request.params,
        query: request.query
      }
    }, 'Request error occurred');

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: error.validation
      });
    }

    // Handle not found
    if (error.statusCode === 404) {
      return reply.status(404).send({
        message: 'Resource not found'
      });
    }

    // Handle unauthorized
    if (error.statusCode === 401) {
      return reply.status(401).send({
        message: 'Unauthorized'
      });
    }

    // Default error response
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Internal server error',
      error: NODE_ENV === 'development' ? error : undefined
    });
  });

  return app;
}

/**
 * Gracefully shutdown the server
 */
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  try {
    if (!app) {
      logger.info('No server instance to shutdown');
      process.exit(0);
      return;
    }

    // Close server first to stop accepting new requests
    await app.close();
    logger.info('Server closed');

    // Close database connection
    if (app.db?.isInitialized) {
      await app.db.destroy();
      logger.info('Database connection closed');
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    logger.error(err, 'Error during graceful shutdown');
    process.exit(1);
  }
}

// Only start server if this file is run directly
if (require.main === module) {
  const start = async () => {
    try {
      await AppDataSource.initialize();
      logger.info('Database connection established');

      app = await createServer({ dataSource: AppDataSource });

      const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
      const address = await app.listen({ port, host: process.env.HOST || '0.0.0.0' });
      logger.info(`Server listening at ${address}`);

      // Handle graceful shutdown
      const signals = ['SIGTERM', 'SIGINT'] as const;
      for (const signal of signals) {
        process.on(signal, async () => {
          await shutdown(signal);
        });
      }
    } catch (err) {
      logger.error(err, 'Failed to start server');
      await shutdown('STARTUP_ERROR');
    }
  };

  start();
}

// Add TypeScript type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    db: typeof AppDataSource;
  }
  
  interface FastifyRequest {
    currentUser?: CurrentUser;
  }
} 