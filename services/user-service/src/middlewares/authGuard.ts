import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../utils/errors';
import { verifyToken } from '../utils/jwt';
import logger from '../utils/logger';

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      logger.warn('No authorization header provided');
      throw new UnauthorizedError('No authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Invalid authorization header format');
      throw new UnauthorizedError('Invalid authorization header format');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      logger.warn('Empty token provided');
      throw new UnauthorizedError('No token provided');
    }

    try {
      const decoded = await verifyToken(token);
      request.user = decoded;
      logger.debug({ userId: decoded.userId, role: decoded.role }, 'Token verified successfully');
    } catch (tokenError: any) {
      logger.error({ 
        error: tokenError.message,
        token: token.substring(0, 10) + '...' // Log only first 10 chars for security
      }, 'Token verification failed');
      
      if (tokenError.message === 'Token has expired') {
        throw new UnauthorizedError('Token has expired');
      }
      throw new UnauthorizedError('Invalid token');
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    logger.error(error, 'Authentication failed');
    throw new UnauthorizedError('Authentication failed');
  }
} 