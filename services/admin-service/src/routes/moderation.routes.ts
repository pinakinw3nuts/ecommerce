import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserController } from '../controllers/user.controller';
import { authGuard } from '../middlewares/authGuard';
import { validateRequest } from '../middlewares/validateRequest';
import { UserFlag } from '../services/userModeration.service';
import { SearchQuery, BanUserParams, BanUserBody, LogQuery } from '../types/moderation';

/**
 * Create Zod validation schemas
 */
// User listing query parameters schema
const getUsersQuerySchema = z.object({
  page: z.string().optional().transform(Number).default('1'),
  limit: z.string().optional().transform(Number).default('20'),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// User ban parameters schema
const banUserParamsSchema = z.object({
  id: z.string().uuid({
    message: 'User ID must be a valid UUID'
  })
});

// User ban body schema
const banUserBodySchema = z.object({
  reason: z.string().min(3, {
    message: 'Reason must be at least 3 characters long'
  }),
  notes: z.string().optional(),
  permanent: z.boolean().optional().default(false),
  expiresAt: z.string().datetime().optional()
});

// Logs query parameters schema
const getLogsQuerySchema = z.object({
  page: z.string().optional().transform(Number).default('1'),
  limit: z.string().optional().transform(Number).default('20'),
  actionType: z.string().optional(),
  adminId: z.string().optional(),
  targetId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

/**
 * Admin-only routes for user moderation
 * Uses Zod validation and auth guard to protect all routes
 */
export default async function moderationRoutes(
  fastify: FastifyInstance,
  opts: { prefix: string }
): Promise<void> {
  // Create controller instance
  const userController = new UserController(
    fastify.diContainer.resolve('userModerationService'),
    fastify.diContainer.resolve('logService')
  );

  // GET /users - List all users with pagination and filtering
  fastify.get<{ Querystring: SearchQuery }>(
    '/users',
    {
      onRequest: [
        authGuard,
        validateRequest(getUsersQuerySchema, 'query')
      ],
      schema: {
        description: 'Get list of users with filtering and pagination',
        tags: ['admin', 'users'],
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

  // PUT /users/:id/ban - Ban or suspend a user
  fastify.put<{ Params: BanUserParams; Body: BanUserBody }>(
    '/users/:id/ban',
    {
      onRequest: [
        authGuard,
        validateRequest(banUserParamsSchema, 'params'),
        validateRequest(banUserBodySchema, 'body')
      ],
      schema: {
        description: 'Ban or suspend a user account',
        tags: ['admin', 'users', 'moderation'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: { type: 'string', minLength: 3 },
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
              message: { type: 'string' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    userController.banUser.bind(userController)
  );

  // PUT /users/:id/unsuspend - Unsuspend a user
  fastify.put<{ Params: { id: string }; Body: { reason: string; notes?: string } }>(
    '/users/:id/unsuspend',
    {
      onRequest: [
        authGuard,
        validateRequest(
          z.object({
            id: z.string().uuid({
              message: 'User ID must be a valid UUID'
            })
          }),
          'params'
        ),
        validateRequest(
          z.object({
            reason: z.string().min(3, {
              message: 'Reason must be at least 3 characters long'
            }),
            notes: z.string().optional()
          }),
          'body'
        )
      ],
      schema: {
        description: 'Unsuspend a previously suspended user',
        tags: ['admin', 'users', 'moderation']
      }
    },
    userController.unsuspendUser.bind(userController)
  );

  // GET /logs - Get admin activity logs with filtering
  fastify.get<{ Querystring: LogQuery }>(
    '/logs',
    {
      onRequest: [
        authGuard,
        validateRequest(getLogsQuerySchema, 'query')
      ],
      schema: {
        description: 'Get admin activity logs with filtering and pagination',
        tags: ['admin', 'logs'],
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

  // GET /users/:id - Get user details by ID
  fastify.get<{ Params: { id: string } }>(
    '/users/:id',
    {
      onRequest: [
        authGuard,
        validateRequest(
          z.object({
            id: z.string().uuid({
              message: 'User ID must be a valid UUID'
            })
          }),
          'params'
        )
      ],
      schema: {
        description: 'Get detailed information about a specific user',
        tags: ['admin', 'users'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        }
      }
    },
    userController.getUserById.bind(userController)
  );
} 