import { FastifyInstance, FastifyBaseLogger, RawServerDefault } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { User } from '../entities/user.entity';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';

// Define swagger schemas outside the route registration
const swaggerSchemas = {
  SignupRequest: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: { type: 'string', format: 'email', description: 'User email address' },
      password: { type: 'string', minLength: 8, description: 'User password (minimum 8 characters)' },
      name: { type: 'string', minLength: 2, description: 'User full name' }
    }
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', description: 'User email address' },
      password: { type: 'string', description: 'User password' }
    }
  },
  GoogleLoginRequest: {
    type: 'object',
    required: ['idToken'],
    properties: {
      idToken: { type: 'string', description: 'Google OAuth ID token' }
    }
  },
  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string', description: 'Refresh token for generating new access token' }
    }
  },
  AuthResponse: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string' },
          isEmailVerified: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      },
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' }
    }
  },
  TokenResponse: {
    type: 'object',
    properties: {
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' }
    }
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['error'] },
      message: { type: 'string' }
    }
  }
};

export async function registerAuthRoutes(
  server: FastifyInstance<RawServerDefault, any, any, FastifyBaseLogger>,
  dataSource: DataSource
): Promise<void> {
  // Get Redis from DI container or create a new instance
  let redis: Redis | null = null;
  
  try {
    // Try to get Redis from DI container if available
    if (server.diContainer) {
      try {
        redis = server.diContainer.resolve<Redis>('redis');
      } catch (error) {
        server.log.warn('Redis not available in DI container');
      }
    }
    
    // If Redis is still null and we're not in production, we'll continue without it
    if (!redis && process.env.NODE_ENV === 'production') {
      server.log.warn('Redis not available but required in production');
    }
  } catch (error) {
    server.log.error(error, 'Failed to initialize Redis');
    // In production, this is a critical error
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
  
  const userRepository = dataSource.getRepository(User);
  const authService = new AuthService(userRepository, redis);
  const authController = new AuthController(authService, redis);

  // Register routes under /auth prefix
  server.register(async (fastify) => {
    // Add schemas to swagger documentation
    for (const [schemaName, schema] of Object.entries(swaggerSchemas)) {
      fastify.addSchema({
        $id: `auth_${schemaName}`,
        ...schema
      });
    }

    // Register controller routes
    await authController.register(fastify);
  }, { prefix: '/auth' });

  // Cleanup Redis on server close if we created it here
  if (redis && !server.diContainer) {
    server.addHook('onClose', async () => {
      await redis?.quit();
    });
  }
} 