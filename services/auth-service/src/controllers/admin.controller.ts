import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.service';
import { UserRole, UserStatus } from '../entities/user.entity';

export class AdminController {
  constructor(private userService: UserService) {}

  listUsers = async (request: FastifyRequest<{
    Querystring: {
      page?: number;
      pageSize?: number;
      search?: string;
      role?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  }>, reply: FastifyReply) => {
    const { page = 1, pageSize = 10, search, role, status, sortBy, sortOrder } = request.query;
    const result = await this.userService.findUsers({
      page,
      pageSize,
      search,
      role,
      status,
      sortBy,
      sortOrder
    });
    return reply.send(result);
  };

  getUserById = async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = await this.userService.findById(id);
    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }
    return reply.send(user);
  };

  updateUser = async (request: FastifyRequest<{
    Params: { id: string },
    Body: {
      name?: string;
      email?: string;
      role?: UserRole;
      status?: UserStatus;
    }
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    const updates = request.body;
    const updatedUser = await this.userService.update(id, updates);
    return reply.send(updatedUser);
  };

  deleteUser = async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    await this.userService.delete(id);
    return reply.status(204).send();
  };
} 