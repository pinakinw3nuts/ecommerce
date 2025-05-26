import { UserService } from '../services/user.service';

declare module 'fastify' {
  interface FastifyInstance {
    diContainer: {
      resolve(service: 'userService'): UserService;
    };
  }
} 