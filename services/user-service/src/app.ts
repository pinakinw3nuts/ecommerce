import 'reflect-metadata';
import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { DataSource } from 'typeorm';
import userRoutes from './routes/user.routes';
import { UserService } from './services/user.service';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { LoyaltyProgramEnrollment } from './entities/loyalty-program-enrollment.entity';
import { AppError } from './utils/errors';
import { swaggerOptions, swaggerUiOptions } from './config/swagger';
import { createAddressRouter } from './routes/address.routes';
import { AddressService } from './services/address.service';
import { healthRoutes } from './routes/health.routes';

declare module 'fastify' {
  interface FastifyInstance {
    diContainer: {
      resolve(service: 'userService'): UserService;
    };
  }
}

export async function createApp() {
  const app = fastify({
    logger: true,
  });

  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register Swagger plugins
  await app.register(swagger, swaggerOptions);
  await app.register(swaggerUi, swaggerUiOptions);

  // Add a redirect from / to /documentation
  app.get('/', (request, reply) => {
    reply.redirect('/documentation');
  });

  // Create TypeORM connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'user_service',
    entities: [User, Address, LoyaltyProgramEnrollment],
    synchronize: process.env.NODE_ENV !== 'production',
  });

  await dataSource.initialize();

  // Create services
  const userService = new UserService(dataSource);
  const addressService = new AddressService(dataSource);

  // Set up dependency injection
  app.decorate('diContainer', {
    resolve: (service: string) => {
      if (service === 'userService') return userService;
      throw new Error(`Unknown service: ${service}`);
    }
  });

  // Register routes
  await app.register(healthRoutes);
  await app.register(userRoutes, { prefix: '/api/v1' });
  await app.register(createAddressRouter(addressService), { prefix: '/api/v1' });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    if (error instanceof AppError) {
      return reply
        .status(error.statusCode)
        .send({ message: error.message, code: error.code });
    }

    return reply.status(500).send({
      message: 'Internal Server Error',
    });
  });

  return app;
} 