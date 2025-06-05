import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { UserStatus, UserRole, User } from '../entities/user.entity';
import logger from '../utils/logger';
import { validateRequest } from '../middlewares/validate-request';
import { TokenPayload } from '../utils/jwt';

// Extend the Request interface to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user: TokenPayload;
  }
}

// Schema for role change
const changeRoleSchema = z.object({
  body: z.object({
    status: z.enum([UserStatus.ACTIVE, UserStatus.BANNED, UserStatus.PENDING])
  })
});

interface CreateUserRequest {
  Body: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    phoneNumber?: string;
    country?: string;
  };
}

interface UpdateUserRequest {
  Params: {
    id: string;
  };
  Body: {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    status?: UserStatus;
    phoneNumber?: string;
    country?: string;
    isEmailVerified?: boolean;
  };
}

interface ListUsersRequest {
  Querystring: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Get current user profile
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Check if user exists in the request
      if (!request.user?.userId) {
        return reply.status(401).send({ message: 'Unauthorized - User not authenticated' });
      }

      const user = await this.userService.getUserProfile(request.user.userId);
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
      if (!request.user?.userId) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const updatedUser = await this.userService.updateUserProfile(
        request.user.userId,
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
      if (!request.user?.userId) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }
      
      const enrollment = await this.userService.enrollInLoyaltyProgram(request.user.userId);
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
      if (!request.user?.userId) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }
      
      const { status } = request.body as { status: UserStatus };
      const updatedUser = await this.userService.changeUserStatus(request.user.userId, status);
      return reply.send(updatedUser);
    } catch (error) {
      logger.error(error, 'Failed to change user role');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async updatePreferences(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user?.userId) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const updatedUser = await this.userService.updateUserPreferences(
        request.user.userId,
        request.body
      );
      return reply.send(updatedUser);
    } catch (error) {
      logger.error(error, 'Failed to update user preferences');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  createUser = async (
    request: FastifyRequest<CreateUserRequest>,
    reply: FastifyReply
  ) => {
    const user = await this.userService.create(request.body);
    return reply.code(201).send(user);
  };

  getUser = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const user = await this.userService.findById(request.params.id);
    return reply.send(user);
  };

  updateUser = async (
    request: FastifyRequest<UpdateUserRequest>,
    reply: FastifyReply
  ) => {
    const user = await this.userService.update(
      request.params.id,
      request.body
    );
    return reply.send(user);
  };

  deleteUser = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    await this.userService.delete(request.params.id);
    return reply.code(204).send();
  };

  listUsers = async (
    request: FastifyRequest<ListUsersRequest>,
    reply: FastifyReply
  ) => {
    const validSortFields: Array<keyof User> = ['id', 'name', 'email', 'role', 'status', 'createdAt', 'updatedAt'];
    const sortBy = validSortFields.includes(request.query.sortBy as keyof User) 
      ? request.query.sortBy as keyof User 
      : 'createdAt';

    const result = await this.userService.list({
      ...request.query,
      sortBy
    });

    // Transform the response to match the expected schema
    return reply.send({
      items: result.users,
      total: result.total,
      page: request.query.page || 1,
      pageSize: request.query.pageSize || 10,
      totalPages: result.totalPages
    });
  };

  verifyEmail = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const user = await this.userService.verifyEmail(request.params.id);
    return reply.send(user);
  };

  updateStatus = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: { status: UserStatus };
    }>,
    reply: FastifyReply
  ) => {
    const user = await this.userService.updateStatus(
      request.params.id,
      request.body.status
    );
    return reply.send(user);
  };
} 