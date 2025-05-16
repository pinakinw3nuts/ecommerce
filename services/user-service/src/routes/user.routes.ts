import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';

// Create a Fastify plugin for user routes
export function createUserRouter(userService: UserService) {
  const userController = new UserController(userService);
  
  return async function(fastify: FastifyInstance) {
    // Apply JWT authentication to all routes
    fastify.addHook('preHandler', async (request, reply) => {
      try {
        const authHeader = request.headers.authorization;
        
        if (!authHeader) {
          return reply.status(401).send({ message: 'Authentication token is required' });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
          return reply.status(401).send({ message: 'Invalid authentication format' });
        }

        // Verify JWT and get user
        try {
          const decoded = fastify.jwt.verify(token) as { id: string };
          const userRepository = userService.dataSource.getRepository('User');
          const user = await userRepository.findOne({ where: { id: decoded.id } });

          if (!user) {
            return reply.status(401).send({ message: 'User not found' });
          }

          // Add user to request
          request.currentUser = {
            id: user.id,
            email: user.email,
            role: user.role
          };
        } catch (error) {
          return reply.status(401).send({ message: 'Invalid or expired token' });
        }
      } catch (error) {
        return reply.status(401).send({ message: 'Authentication failed' });
      }
    });

    // Profile management routes
    fastify.get('/me', async (request, reply) => {
      return userController.getProfile(request as any, reply as any);
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