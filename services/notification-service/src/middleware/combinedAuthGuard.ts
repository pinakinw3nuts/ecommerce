import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { User } from '../types/fastify';

/**
 * Combined authentication middleware that checks for both JWT and service token auth
 * This is a higher-level guard that can be applied to routes that need
 * authentication from either source
 */
export async function combinedAuthGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    // If already authenticated by service token, proceed
    if (request.user && request.user.id) {
      return;
    }
    
    // Otherwise, verify JWT token
    await request.jwtVerify();
    
    // If we get here, JWT is valid
    logger.debug('JWT authentication successful', {
      userId: request.user && typeof request.user === 'object' ? request.user.id : undefined,
      url: request.url,
      method: request.method
    });
  } catch (error) {
    logger.warn('Authentication failed', {
      url: request.url,
      method: request.method,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return reply.status(401).send({
      message: 'Authentication required',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }
} 