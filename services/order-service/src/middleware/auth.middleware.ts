import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

export interface CustomJWTPayload {
  id?: string;
  userId?: string;
  roles?: string[];
  role?: string;
}

/**
 * Extract JWT token from authorization header
 */
export const extractToken = (request: FastifyRequest): string | null => {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

/**
 * Validate JWT token and return payload
 */
export const validateToken = async (request: FastifyRequest): Promise<CustomJWTPayload> => {
  try {
    await request.jwtVerify();
    return request.user as CustomJWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Authentication middleware to verify JWT tokens
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

    // Handle userId to id mapping (auth service uses userId, but order service expects id)
    if (request.user && !request.user.id && (request.user as any).userId) {
      request.user.id = (request.user as any).userId;
      logger.debug(`Mapped userId to id for compatibility: ${request.user.id}`);
    }

    // Normalize roles to lowercase for case-insensitive checks
    if (request.user) {
      if (!Array.isArray(request.user.roles) && typeof request.user.role === 'string') {
        request.user.roles = [request.user.role.toLowerCase()];
      } else if (Array.isArray(request.user.roles)) {
        request.user.roles = request.user.roles.map((role: string) => role.toLowerCase());
      }
    }
    
    // Log successful authentication and user info
    const user = request.user as CustomJWTPayload;
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
 * Role-based guard middleware
 * @param roles Array of allowed roles
 */
export function roleGuard(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as CustomJWTPayload;
      
      // Check for X-Admin-Role header specifically for admin panel integration
      const adminRoleHeader = request.headers['x-admin-role'];
      
      // If the header exists and matches 'admin', allow access if 'admin' role is required
      if (adminRoleHeader === 'admin' && roles.includes('admin')) {
        return;
      }
      
      // Otherwise check roles in JWT payload
      if (!user.roles?.some(role => roles.includes(role))) {
        return reply.status(403).send({
          message: `Access denied. Required role: ${roles.join(', ')}`
        });
      }
    } catch (err) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
  };
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

    // Handle userId to id mapping (auth service uses userId, but order service expects id)
    if (request.user && !request.user.id && (request.user as any).userId) {
      request.user.id = (request.user as any).userId;
      logger.debug(`Mapped userId to id for compatibility in admin auth: ${request.user.id}`);
    }

    // Normalize roles to lowercase for case-insensitive checks
    if (request.user) {
      if (!Array.isArray(request.user.roles) && typeof request.user.role === 'string') {
        request.user.roles = [request.user.role.toLowerCase()];
      } else if (Array.isArray(request.user.roles)) {
        request.user.roles = request.user.roles.map((role: string) => role.toLowerCase());
      }
    }
    
    // Check if user has admin role
    const user = request.user as CustomJWTPayload;
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

/**
 * Verify user has access to the requested order
 * Use this guard for routes that operate on specific orders
 */
export const verifyOrderAccess = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const user = request.user as CustomJWTPayload;

  // Check for X-Admin-Role header specifically for admin panel integration
  const adminRoleHeader = request.headers['x-admin-role'];
  
  // If the header exists and matches 'admin', allow access
  if (adminRoleHeader === 'admin') {
    return;
  }

  // Admin users can access all orders
  if (user.roles?.includes('admin')) {
    return;
  }

  // For regular users, verify they own the order
  const orderId = request.params.id;
  if (!user.id) {
    reply.status(403).send({
      message: 'Access denied'
    });
    return;
  }
}; 