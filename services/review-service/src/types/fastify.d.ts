import { JwtPayload } from '../middleware/authGuard';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
} 