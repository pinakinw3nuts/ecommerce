import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserService, ChangePasswordData } from '../services/user.service';
import { validateRequest } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';
import logger from '../utils/logger';

const userLogger = logger.child({ module: 'user-controller' });

// Request validation schemas
const updatePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

const updatePasswordSchema = {
  body: updatePasswordBodySchema
};

type UpdatePasswordBody = z.infer<typeof updatePasswordBodySchema>;

interface CustomError extends Error {
  code?: string;
  message: string;
}

export class UserController {
  constructor(private userService: UserService) {}

  async register(fastify: FastifyInstance) {
    // Get current user profile route
    fastify.get(
      '/me',
      {
        preHandler: authGuard(),
        schema: {
          response: {
            200: {
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
            }
          }
        }
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const user = await this.userService.findById(request.user!.userId);
          
          if (!user) {
            return reply.status(404).send({
              status: 'error',
              message: 'User not found'
            });
          }

          return reply.send(user);
        } catch (error) {
          userLogger.error({ error, userId: request.user!.userId }, 'Error fetching user profile');
          throw error;
        }
      }
    );

    // Update password route
    fastify.post<{ Body: UpdatePasswordBody }>(
      '/update-password',
      {
        preHandler: [authGuard(), validateRequest(updatePasswordSchema)],
        schema: {
          body: {
            type: 'object',
            required: ['currentPassword', 'newPassword'],
            properties: {
              currentPassword: { type: 'string', minLength: 1 },
              newPassword: { type: 'string', minLength: 8 }
            }
          },
          response: {
            200: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      async (request, reply) => {
        try {
          await this.userService.changePassword(
            request.user!.userId,
            request.body as ChangePasswordData
          );

          return reply.send({
            status: 'success',
            message: 'Password updated successfully'
          });
        } catch (error) {
          userLogger.error(
            { error, userId: request.user!.userId },
            'Error updating password'
          );

          const customError = error as CustomError;

          if (customError.code === 'INVALID_PASSWORD') {
            return reply.status(400).send({
              status: 'error',
              message: 'Current password is incorrect'
            });
          }

          if (customError.code === 'INVALID_NEW_PASSWORD') {
            return reply.status(400).send({
              status: 'error',
              message: customError.message
            });
          }

          if (customError.code === 'SAME_PASSWORD') {
            return reply.status(400).send({
              status: 'error',
              message: 'New password must be different from current password'
            });
          }

          throw error;
        }
      }
    );
  }
} 