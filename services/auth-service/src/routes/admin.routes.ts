import { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/admin.controller';
import { adminGuard } from '../middlewares/authGuard';
import { UserService } from '../services/user.service';
import { UserRole, UserStatus } from '../entities/user.entity';

export default async function adminRoutes(fastify: FastifyInstance) {
  // Apply admin guard to all routes
  fastify.addHook('preHandler', adminGuard);

  const adminController = new AdminController(fastify.diContainer.resolve('userService') as UserService);

  // List users with filtering
  fastify.get('/users', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          pageSize: { type: 'integer', default: 10 },
          search: { type: 'string' },
          role: { type: 'string' },
          status: { type: 'string' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  lastLogin: { type: ['string', 'null'] }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
                currentPage: { type: 'integer' },
                pageSize: { type: 'integer' },
                hasMore: { type: 'boolean' },
                hasPrevious: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, adminController.listUsers);

  // Get user by ID
  fastify.get('/users/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, adminController.getUserById);

  // Update user
  fastify.patch('/users/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: Object.values(UserRole) },
          status: { type: 'string', enum: Object.values(UserStatus) }
        }
      }
    }
  }, adminController.updateUser);

  // Delete user
  fastify.delete('/users/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, adminController.deleteUser);
} 