import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: User;
}

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verify JWT token using fastify-jwt
    await request.jwtVerify();

    // Add user to request object
    const user = request.user as User;
    
    logger.debug({ userId: user.id }, 'User authenticated');
  } catch (error) {
    logger.warn({ error }, 'Authentication failed');
    
    return reply.code(401).send({
      message: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }
} 