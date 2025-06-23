import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

/**
 * Authentication middleware to verify JWT tokens
 * Similar to the pattern used in checkout-service
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Log auth header for debugging
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      logger.warn('Authorization header missing for request: ' + request.url);
      throw new Error('Authorization header is required');
    }
    
    // Extract the token from the Authorization header
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else {
      // Be more lenient - if there's no Bearer prefix but the header looks like a token, use it
      logger.warn(`Authorization header format unusual (missing Bearer prefix) for ${request.url}: ${authHeader.substring(0, 15)}...`);
      token = authHeader;
    }
    
    // Log token info (first few characters for debugging)
    logger.debug(`Verifying token for ${request.url}: ${token.substring(0, 10)}...`);
    
    // Set the raw token for JWT verification
    request.headers.authorization = `Bearer ${token}`;
    
    // Verify the JWT token
    await request.jwtVerify();
    
    // Log successful authentication and user info
    const user = request.user as { id?: string, roles?: string[] };
    logger.debug(`Authentication successful for request: ${request.url}, user: ${user?.id || 'unknown'}`);
    
  } catch (err) {
    // Log the authentication failure with detailed information
    logger.warn('Authentication failed for request: ' + request.url);
    logger.warn('Error details:', err instanceof Error ? err.message : String(err));
    
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
    // Log auth header for debugging
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      logger.warn('Authorization header missing for admin request: ' + request.url);
      throw new Error('Authorization header is required');
    }
    
    // Extract the token from the Authorization header
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else {
      // Be more lenient - if there's no Bearer prefix but the header looks like a token, use it
      logger.warn(`Authorization header format unusual (missing Bearer prefix) for admin request ${request.url}: ${authHeader.substring(0, 15)}...`);
      token = authHeader;
    }
    
    // Set the raw token for JWT verification
    request.headers.authorization = `Bearer ${token}`;
    
    // First verify the JWT token
    await request.jwtVerify();
    
    // Check if user has admin role
    const user = request.user as { id?: string, roles?: string[] };
    if (!user || !user.id || !user.roles || !user.roles.includes('admin')) {
      logger.warn(`Admin access denied for user: ${user?.id || 'unknown'}`);
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'Admin privileges required'
      });
    }
    
    // Log successful admin authentication
    logger.debug(`Admin authentication successful for user: ${user.id}`);
    
  } catch (err) {
    // Log the authentication failure with detailed information
    logger.warn('Admin authentication failed for request: ' + request.url);
    logger.warn('Error details:', err instanceof Error ? err.message : String(err));
    
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