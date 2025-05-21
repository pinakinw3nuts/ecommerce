import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user.controller';
import { authGuard } from '../middlewares/authGuard';
import { UserFlag } from '../services/userModeration.service';
import { SearchQuery, BanUserParams, BanUserBody, LogQuery } from '../types/moderation';

/**
 * User management and activity log routes for admin service
 * All routes are protected with authentication and admin role checks
 */
export default async function userRoutes(
  fastify: FastifyInstance,
  opts: { prefix: string }
): Promise<void> {
  // Create controller instance
  const userController = new UserController(
    fastify.diContainer.resolve('userModerationService'),
    fastify.diContainer.resolve('logService')
  );

  // Get all users with filtering and pagination
  fastify.get<{ Querystring: SearchQuery }>(
    '/users',
    {
      onRequest: [authGuard],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 20 },
            search: { type: 'string' },
            status: { type: 'string' },
            sortBy: { type: 'string', default: 'createdAt' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  users: { type: 'array' },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    userController.getUsers.bind(userController)
  );

  // Get a specific user by ID
  fastify.get<{ Params: { id: string } }>(
    '/users/:id',
    {
      onRequest: [authGuard],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    userController.getUserById.bind(userController)
  );

  // Ban or suspend a user
  fastify.put<{ Params: BanUserParams; Body: BanUserBody }>(
    '/users/:id/ban',
    {
      onRequest: [authGuard],
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
          required: ['reason'],
          properties: {
            reason: { type: 'string' },
            notes: { type: 'string' },
            permanent: { type: 'boolean', default: false },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    userController.banUser.bind(userController)
  );

  // Unsuspend a user
  fastify.put<{ Params: { id: string }; Body: { reason: string; notes?: string } }>(
    '/users/:id/unsuspend',
    {
      onRequest: [authGuard],
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
          required: ['reason'],
          properties: {
            reason: { type: 'string' },
            notes: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    userController.unsuspendUser.bind(userController)
  );

  // Flag a user account
  fastify.put<{ Params: { id: string }; Body: { flag: string; reason: string } }>(
    '/users/:id/flag',
    {
      onRequest: [authGuard],
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
          required: ['flag', 'reason'],
          properties: {
            flag: { 
              type: 'string', 
              enum: Object.values(UserFlag)
            },
            reason: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    userController.flagUser.bind(userController)
  );

  // Get admin activity logs
  fastify.get<{ Querystring: LogQuery }>(
    '/logs',
    {
      onRequest: [authGuard],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 20 },
            actionType: { type: 'string' },
            adminId: { type: 'string' },
            targetId: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  logs: { type: 'array' },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    userController.getLogs.bind(userController)
  );
} 