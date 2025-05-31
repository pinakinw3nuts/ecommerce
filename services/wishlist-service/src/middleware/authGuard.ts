import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

/**
 * Authentication middleware that verifies JWT tokens
 * and attaches the user information to the request object
 */
export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verify JWT token - this will throw if token is invalid
    await request.jwtVerify();
    
    // TypeScript type assertion for the user object
    const user = request.user as { id: string; roles?: string[] };
    
    // Ensure user ID exists
    if (!user?.id) {
      logger.warn('JWT token missing user ID', { 
        url: request.url,
        method: request.method
      });
      return reply.status(401).send({
        message: 'Invalid authentication token',
        error: 'INVALID_TOKEN'
      });
    }
    
    // Log successful authentication
    logger.debug('User authenticated', { 
      userId: user.id,
      url: request.url,
      method: request.method
    });
    
    // Continue to route handler
  } catch (error) {
    // Log authentication failure
    logger.warn('Authentication failed', {
      url: request.url,
      method: request.method,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return authentication error
    return reply.status(401).send({
      message: 'Authentication required',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }
} 