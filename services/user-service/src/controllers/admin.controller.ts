import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.service';
import { UserStatus, UserRole } from '../entities';
import logger from '../utils/logger';
import { AppDataSource } from '../data-source';

export class AdminController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService(AppDataSource);
  }

  /**
   * List users with filtering and pagination
   */
  async listUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { 
        page = 1, 
        limit = 10,
        search,
        roles,
        statuses,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        country
      } = request.query as any;

      const filters = {
        page: Number(page),
        limit: Number(limit),
        search,
        roles: roles?.split(','),
        statuses: statuses?.split(','),
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
        country
      };
      logger.debug('Filters:', filters);
      const result = await this.userService.findUsersWithFilters(filters);
      return reply.send(result);
    } catch (error) {
      logger.error(error, 'Failed to list users');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  /**
   * Get user details by ID
   */
  async getUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const user = await this.userService.getUserById(id, ['addresses', 'loyaltyProgram']);
      return reply.send(user);
    } catch (error) {
      logger.error(error, 'Failed to get user details');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(request: FastifyRequest<{ 
    Params: { id: string },
    Body: { status: UserStatus }
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { status } = request.body;
      
      const user = await this.userService.changeUserStatus(id, status);
      return reply.send(user);
    } catch (error) {
      logger.error(error, 'Failed to update user status');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  /**
   * Create new user
   */
  async createUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userData = request.body as any;
      const user = await this.userService.createUser(userData);
      return reply.status(201).send(user);
    } catch (error) {
      logger.error(error, 'Failed to create user');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      await this.userService.deleteUser(id);
      return reply.send({ success: true });
    } catch (error) {
      logger.error(error, 'Failed to delete user');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  /**
   * Get multiple users by IDs (batch)
   */
  async getUsersByIds(
    request: FastifyRequest<{
      Body: { userIds: string[] };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userIds } = request.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return reply.status(400).send({ message: 'User IDs must be a non-empty array' });
      }
      
      if (userIds.length > 100) {
        return reply.status(400).send({ message: 'Too many user IDs. Maximum allowed: 100' });
      }
      
      const users = await this.userService.getUsersByIds(userIds);
      return reply.send(users);
    } catch (error) {
      logger.error(`Failed to get users batch: ${error}`);
      return reply.status(500).send({ message: 'Failed to fetch users' });
    }
  }
} 