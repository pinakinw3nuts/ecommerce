import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AdminController } from '../controllers/admin.controller';
import { UserService } from '../services/user.service';
import { createAuthMiddleware } from '../middlewares/auth';
import { UserRole, UserStatus } from '../entities';

// Admin role check middleware
const adminGuard = async (request: any, reply: any) => {
  if (request.currentUser?.role !== UserRole.ADMIN) {
    return reply.status(403).send({ message: 'Admin access required' });
  }
};

interface GetUserParams {
  Params: { id: string };
}

interface UpdateUserStatusParams {
  Params: { id: string };
  Body: { status: UserStatus };
}

interface BatchUsersParams {
  Body: { userIds: string[] };
}

export function createAdminRouter(userService: UserService) {
  const adminController = new AdminController(userService);
  
  return async function(fastify: FastifyInstance) {
    // Apply JWT authentication and admin guard to all routes
    fastify.addHook('preHandler', createAuthMiddleware(userService.dataSource));
    fastify.addHook('preHandler', adminGuard);

    // List users with filtering
    fastify.get('/users', async (request, reply) => {
      
      return adminController.listUsers(request, reply);
    });

    // Get user details
    fastify.get<GetUserParams>('/users/:id', async (request, reply) => {
      return adminController.getUserById(request, reply);
    });

    // Create new user
    fastify.post('/users', async (request, reply) => {
      return adminController.createUser(request, reply);
    });

    // Update user status
    fastify.patch<UpdateUserStatusParams>('/users/:id/status', async (request, reply) => {
      return adminController.updateUserStatus(request, reply);
    });

    // Delete user
    fastify.delete<GetUserParams>('/users/:id', async (request, reply) => {
      return adminController.deleteUser(request, reply);
    });

    // Batch users endpoint
    fastify.post<BatchUsersParams>('/users/batch', async (request, reply) => {
      return adminController.getUsersByIds(request, reply);
    });
  };
} 