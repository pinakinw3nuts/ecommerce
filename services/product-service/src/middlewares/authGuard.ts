import { FastifyRequest, FastifyReply } from 'fastify';
import { decodeToken } from '../utils/jwt';
import logger from '../utils/logger';

export interface CurrentUser {
  userId: string;
  email?: string;
  role?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: CurrentUser;
  }
}

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ message: 'Authentication token is required' });
    }
    const token = authHeader.slice(7);
    const decoded = decodeToken<CurrentUser>(token);
    if (!decoded || !decoded.userId) {
      return reply.status(401).send({ message: 'Invalid or expired token' });
    }
    request.currentUser = decoded;
  } catch (error) {
    logger.error({ error }, 'Authentication failed');
    return reply.status(401).send({ message: 'Authentication failed' });
  }
} 