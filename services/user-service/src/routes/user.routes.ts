import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user.controller';
import { authGuard } from '../middlewares/authGuard';
import { UserRole, UserStatus } from '../entities/user.entity';
import { Type } from '@fastify/type-provider-typebox';

// Define the User response schema
const userResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: Object.values(UserRole) },
    status: { type: 'string', enum: Object.values(UserStatus) },
    isEmailVerified: { type: 'boolean' },
    phoneNumber: { type: 'string' },
    country: { type: 'string' },
    lastLogin: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export default async function userRoutes(fastify: FastifyInstance) {
  const userController = new UserController(fastify.diContainer.resolve('userService'));

  // Apply authentication to all routes except create
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.routeOptions.url === '/users' && request.method === 'POST') {
      return;
    }
    return authGuard(request, reply);
  });

  // Get current user profile - single endpoint
  fastify.get('/user/me', {
    schema: {
      tags: ['users'],
      summary: 'Get current user profile',
      description: 'Retrieve the profile of the currently authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'User profile retrieved successfully',
          ...userResponseSchema
        },
        401: {
          description: 'Unauthorized - Authentication required',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, userController.getProfile.bind(userController));

  // Handle OPTIONS requests for CORS preflight
  fastify.options('/user/me', (_, reply) => {
    return reply.send();
  });

  // Update current user profile - single endpoint
  fastify.patch('/user/me', {
    schema: {
      tags: ['users'],
      summary: 'Update current user profile',
      description: 'Update the profile of the currently authenticated user',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full name of the user' },
          email: { type: 'string', format: 'email', description: 'Email address' },
          phoneNumber: { type: 'string', description: 'Phone number' },
          country: { type: 'string', description: 'Country of residence' },
        },
      },
      response: {
        200: {
          description: 'User profile updated successfully',
          ...userResponseSchema
        },
        401: {
          description: 'Unauthorized - Authentication required',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, userController.updateProfile.bind(userController));

  // Create user (public route)
  fastify.post('/users', {
    schema: {
      tags: ['users'],
      summary: 'Create a new user',
      description: 'Create a new user account with the provided details',
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', description: 'Full name of the user' },
          email: { type: 'string', format: 'email', description: 'Email address' },
          password: { type: 'string', minLength: 8, description: 'Password (min 8 characters)' },
          phoneNumber: { type: 'string', description: 'Phone number' },
          country: { type: 'string', description: 'Country of residence' },
        },
      },
      response: {
        201: {
          description: 'User created successfully',
          ...userResponseSchema
        },
        400: {
          description: 'Bad Request - Invalid input data',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        409: {
          description: 'Conflict - Email already exists',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, userController.createUser);

  // Get user by ID (authenticated)
  fastify.get('/users/:id', {
    schema: {
      tags: ['users'],
      summary: 'Get user by ID',
      description: 'Retrieve user details by their ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'User ID' },
        },
      },
      response: {
        200: {
          description: 'User found successfully',
          ...userResponseSchema
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, userController.getUser);

  // Update user (authenticated)
  fastify.patch('/users/:id', {
    schema: {
      tags: ['users'],
      summary: 'Update user',
      description: 'Update user details by their ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'User ID' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full name of the user' },
          email: { type: 'string', format: 'email', description: 'Email address' },
          password: { type: 'string', minLength: 8, description: 'New password (min 8 characters)' },
          role: { type: 'string', enum: Object.values(UserRole), description: 'User role' },
          status: { type: 'string', enum: Object.values(UserStatus), description: 'User status' },
          phoneNumber: { type: 'string', description: 'Phone number' },
          country: { type: 'string', description: 'Country of residence' },
          isEmailVerified: { type: 'boolean', description: 'Email verification status' },
        },
      },
      response: {
        200: {
          description: 'User updated successfully',
          ...userResponseSchema
        },
        400: {
          description: 'Bad Request - Invalid input data',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, userController.updateUser);

  // Delete user (admin only)
  fastify.delete('/users/:id', {
    schema: {
      tags: ['users'],
      summary: 'Delete user',
      description: 'Delete a user by their ID (Admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'User ID to delete' },
        },
      },
      response: {
        204: {
          description: 'User deleted successfully',
          type: 'null'
        },
        403: {
          description: 'Forbidden - Admin access required',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: async (request: any, reply) => {
      if (request.user?.role !== UserRole.ADMIN) {
        return reply.status(403).send({ message: 'Admin access required' });
      }
    }
  }, userController.deleteUser);

  // List users (admin only)
  fastify.get('/users', {
    schema: {
      tags: ['users'],
      summary: 'List users',
      description: 'Get a paginated list of users (Admin only)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, description: 'Page number' },
          pageSize: { type: 'integer', minimum: 1, maximum: 100, description: 'Items per page' },
          search: { type: 'string', description: 'Search term for name or email' },
          role: { type: 'string', enum: Object.values(UserRole), description: 'Filter by role' },
          status: { type: 'string', enum: Object.values(UserStatus), description: 'Filter by status' },
          sortBy: { type: 'string', description: 'Field to sort by' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], description: 'Sort direction' },
        },
      },
      response: {
        200: {
          description: 'List of users',
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: userResponseSchema
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        },
        403: {
          description: 'Forbidden - Admin access required',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: async (request: any, reply) => {
      if (request.user?.role !== UserRole.ADMIN) {
        return reply.status(403).send({ message: 'Admin access required' });
      }
    }
  }, userController.listUsers);

  // Verify email
  fastify.post('/users/:id/verify-email', {
    schema: {
      tags: ['users'],
      summary: 'Verify email',
      description: 'Verify user email address',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'User ID' },
        },
      },
      response: {
        200: {
          description: 'Email verified successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: userResponseSchema
          }
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, userController.verifyEmail);

  // Update user status (admin only)
  fastify.patch('/users/:id/status', {
    preHandler: async (request: any, reply) => {
      if (request.user?.role !== UserRole.ADMIN) {
        return reply.status(403).send({ message: 'Admin access required' });
      }
    },
    schema: {
      tags: ['users'],
      summary: 'Update user status',
      description: 'Update user status (Admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'User ID' },
        },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: Object.values(UserStatus), description: 'New user status' },
        },
      },
      response: {
        200: {
          description: 'Status updated successfully',
          ...userResponseSchema
        },
        403: {
          description: 'Forbidden - Admin access required',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, userController.updateStatus);
} 