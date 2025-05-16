import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { UserStatus } from '../entities';
import logger from '../utils/logger';
import { validateRequest } from '../middlewares/validate-request';
import { CurrentUser } from '../middlewares/auth';

// Extend the Request interface
declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

// Schema for role change
const changeRoleSchema = z.object({
  body: z.object({
    status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED])
  })
});

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Get current user profile
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await this.userService.getUserProfile(request.currentUser.id);
      return reply.send(user);
    } catch (error) {
      logger.error(error, 'Failed to get user profile');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.currentUser?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const updatedUser = await this.userService.updateUserProfile(
        request.currentUser.id,
        request.body
      );
      return reply.send(updatedUser);
    } catch (error) {
      logger.error(error, 'Failed to update user profile');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  /**
   * Enroll user in loyalty program
   */
  async enrollInLoyalty(request: FastifyRequest, reply: FastifyReply) {
    try {
      const enrollment = await this.userService.enrollInLoyaltyProgram(request.currentUser.id);
      return reply.send(enrollment);
    } catch (error) {
      logger.error(error, 'Failed to enroll user in loyalty program');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  /**
   * Change user role/status
   */
  async changeRole(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { status } = request.body as { status: UserStatus };
      const updatedUser = await this.userService.changeUserStatus(request.currentUser.id, status);
      return reply.send(updatedUser);
    } catch (error) {
      logger.error(error, 'Failed to change user role');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async updatePreferences(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.currentUser?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const updatedUser = await this.userService.updateUserPreferences(
        request.currentUser.id,
        request.body
      );
      return reply.send(updatedUser);
    } catch (error) {
      logger.error(error, 'Failed to update user preferences');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }
} 