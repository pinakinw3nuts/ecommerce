import { FastifyInstance, FastifyBaseLogger, RawServerDefault } from 'fastify';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';
import { DataSource } from 'typeorm';

// Define swagger schemas outside the route registration
const swaggerSchemas = {
  UserProfile: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string' },
      isEmailVerified: { type: 'boolean' },
      is2FAEnabled: { type: 'boolean' },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' },
      lastLogin: { type: ['string', 'null'] }
    }
  },
  UpdatePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string' },
      newPassword: { type: 'string', minLength: 8 }
    }
  },
  SuccessResponse: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['success'] },
      message: { type: 'string' }
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

export async function registerUserRoutes(
  server: FastifyInstance<RawServerDefault, any, any, FastifyBaseLogger>,
  dataSource: DataSource
): Promise<void> {
  // Initialize dependencies
  const userRepository = dataSource.getRepository(User);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  // Add schemas to swagger documentation
  for (const [schemaName, schema] of Object.entries(swaggerSchemas)) {
    server.addSchema({
      $id: `users_${schemaName}`,
      ...schema
    });
  }

  // Register routes under /users prefix
  server.register(
    async (fastifyInstance) => {
      // Register controller routes
      await userController.register(fastifyInstance);
    },
    { prefix: '/users' }
  );
} 