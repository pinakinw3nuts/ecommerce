import { DIContainer } from '../../di-container';
import { User } from '../../middlewares/authGuard';

declare module 'fastify' {
  interface FastifyInstance {
    diContainer: DIContainer;
  }

  interface FastifyRequest {
    user?: User;
  }
} 