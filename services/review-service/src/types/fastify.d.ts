import { JwtPayload } from '../middlewares/authGuard';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
} 