import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

/**
 * Authentication middleware to verify JWT tokens
 * Similar to the pattern used in checkout-service
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verify the JWT token
    await request.jwtVerify();
    
    // Log successful authentication
    logger.debug('Authentication successful for request: ' + request.url);
    
  } catch (err) {
    // Log the authentication failure
    logger.warn('Authentication failed:', err instanceof Error ? err.message : String(err));
    
    // Return 401 Unauthorized with a clear message
    reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: err instanceof Error ? err.message : 'Authentication required',
      details: process.env.NODE_ENV === 'development' 
        ? (err instanceof Error ? err.message : String(err))
        : undefined
    });
  }
}

/**
 * Middleware to check if the user has admin role
 * Used for routes that require admin privileges
 */
export async function adminAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // First verify the JWT token
    await request.jwtVerify();
    
    // Check if user has admin role
    const user = request.user as { roles?: string[] };
    if (!user || !user.roles || !user.roles.includes('admin')) {
      logger.warn('Admin access denied for user:', user);
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'Admin privileges required'
      });
    }
    
    // Log successful admin authentication
    logger.debug('Admin authentication successful');
    
  } catch (err) {
    // Log the authentication failure
    logger.warn('Authentication failed:', err instanceof Error ? err.message : String(err));
    
    // Return 401 Unauthorized with a clear message
    reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: err instanceof Error ? err.message : 'Authentication required'
    });
  }
} 