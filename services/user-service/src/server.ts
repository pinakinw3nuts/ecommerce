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
import userRoutes from './routes/user.routes';
import { createAddressRouter } from './routes/address.routes';
import { healthRoutes } from './routes/health.routes';
import { CurrentUser } from './middlewares/auth';
import { AppDataSource } from './data-source';
import { createApp } from './app';

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
  await app.register(async (fastify) => {
    fastify.decorate('userService', new UserService(options.dataSource));
    await userRoutes(fastify);
  }, { prefix: '/api/v1' });
  await app.register(async (fastify) => {
    const addressService = new AddressService(options.dataSource);
    const router = createAddressRouter(addressService);
    await router(fastify);
  }, { prefix: '/api/v1' });

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

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    const app = await createApp();
    await app.listen({ port: Number(PORT), host: HOST });
    
    app.log.info(`Server is running on http://${HOST}:${PORT}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();

// Add TypeScript type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    db: typeof AppDataSource;
  }
  
  interface FastifyRequest {
    currentUser?: CurrentUser;
  }
} 