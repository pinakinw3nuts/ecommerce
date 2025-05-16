import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { createAuthMiddleware } from '../middlewares/auth';

// Create a Fastify plugin for user routes
export function createUserRouter(userService: UserService) {
  const userController = new UserController(userService);
  
  return async function(fastify: FastifyInstance) {
    // Apply JWT authentication to all routes
    fastify.addHook('preHandler', createAuthMiddleware(userService.dataSource));

    // Profile management routes
    fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getProfile(request, reply);
    });

    fastify.patch('/update-profile', async (request, reply) => {
      return userController.updateProfile(request as any, reply as any);
    });

    // Status/role management routes
    fastify.patch('/change-role', async (request, reply) => {
      // Call the middleware and handler manually
      try {
        await userController.changeRole[0](request as any, reply as any, () => {});
        return userController.changeRole[1](request as any, reply as any, () => {});
      } catch (error) {
        reply.status(500).send({ message: 'Failed to change role' });
      }
    });

    // Loyalty program routes
    fastify.post('/enroll-loyalty', async (request, reply) => {
      return userController.enrollInLoyalty(request as any, reply as any);
    });
  };
} 