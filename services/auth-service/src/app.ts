import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import helmet from '@fastify/helmet';
import Redis from 'ioredis';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { AuthService } from './services/auth.service';
import { registerAuthRoutes } from './routes/auth.routes';
import { configTyped } from './config/env';
import logger from './utils/logger';
import bcrypt from 'bcrypt';
import { AppDataSource } from './config/data-source';

interface DIContainer {
  dependencies: Map<string, any>;
  register<T>(name: string, instance: T): void;
  resolve<T>(name: string): T;
}

// Declare module augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    diContainer: DIContainer;
  }
}

async function ensureAdminUser() {
  const userRepository = AppDataSource.getRepository(User);
  
  try {
    logger.info('Checking for admin user...');
    
    // Check if admin exists
    const adminExists = await userRepository.findOne({
      where: { 
        role: UserRole.ADMIN,
        email: 'admin@example.com'
      },
      select: ['id', 'email', 'role', 'status'] // Add select to see the fields
    });

    if (adminExists) {
      logger.info({
        userId: adminExists.id,
        email: adminExists.email,
        role: adminExists.role,
        status: adminExists.status
      }, 'Admin user already exists');
      return;
    }

    logger.info('Creating admin user...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = userRepository.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true
    });

    const savedUser = await userRepository.save(adminUser);
    logger.info({
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
      status: savedUser.status
    }, 'Admin user created successfully');
  } catch (error) {
    logger.error(error, 'Failed to ensure admin user exists');
    throw error; // Re-throw to prevent app from starting if this fails
  }
}

export default async function createApp() {
  // Create Fastify instance
  const app = fastify({
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

  // Register CORS
  await app.register(cors, {
    origin: configTyped.cors.origin,
    credentials: true
  });
  
  // Register Helmet for security headers
  await app.register(helmet);
  
  // Register Swagger
  await app.register(swagger, {
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

  // Register Swagger UI
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    }
  });

  // Initialize Redis connection (with fallback for development)
  let redis: Redis | null = null;
  
  try {
    // Only try to connect to Redis in production or if explicitly enabled
    if (configTyped.isProduction || process.env.ENABLE_REDIS === 'true') {
      redis = new Redis({
        host: configTyped.redis.host,
        port: configTyped.redis.port,
        password: configTyped.redis.password,
        db: configTyped.redis.db,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          logger.info({ times, delay }, 'Redis reconnection attempt');
          return delay;
        }
      });

      redis.on('error', (error: Error) => {
        logger.error(error, 'Redis connection error');
      });

      redis.on('connect', () => {
        logger.info('Redis connected successfully');
      });
    } else {
      logger.warn('Redis is disabled in development mode. Rate limiting and caching will not work.');
    }
  } catch (error) {
    logger.error(error, 'Failed to initialize Redis');
    // Continue without Redis in development
    if (configTyped.isProduction) {
      throw error; // Re-throw in production
    }
  }

  // Initialize database connection
  try {
    await AppDataSource.initialize();
    logger.info('Database connection initialized');
  } catch (error) {
    logger.error(error, 'Failed to initialize database connection');
    throw error;
  }

  // Create DI container
  const container: DIContainer = {
    dependencies: new Map(),
    register<T>(name: string, instance: T) {
      this.dependencies.set(name, instance);
    },
    resolve<T>(name: string): T {
      const instance = this.dependencies.get(name);
      if (!instance) {
        switch (name) {
          case 'authService':
            return new AuthService(AppDataSource.getRepository(User), redis as Redis) as T;
          case 'dataSource':
            return AppDataSource as T;
          case 'redis':
            return redis as T;
          default:
            throw new Error(`Unknown dependency: ${name}`);
        }
      }
      return instance as T;
    }
  };

  // Register DI container
  app.decorate('diContainer', container);

  // Register routes
  await app.register(async (fastify) => {
    await registerAuthRoutes(fastify, AppDataSource);
  }, { prefix: '/api' });

  // Ensure admin user exists
  await ensureAdminUser();

  // Error handler
  app.setErrorHandler((error, _request, reply) => {
    logger.error(error);
    reply.status(500).send({
      status: 'error',
      message: 'Internal Server Error'
    });
  });

  // Cleanup on app close
  app.addHook('onClose', async () => {
    if (redis) {
      await redis.quit();
    }
    await AppDataSource.destroy();
  });

  return app;
}

// Start the server if this file is run directly
if (require.main === module) {
  const start = async () => {
    try {
      const app = await createApp();
      await app.listen({ 
        port: configTyped.port,
        host: configTyped.host
      });
      logger.info(`Server listening on ${configTyped.host}:${configTyped.port}`);
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
  };
  start();
} 