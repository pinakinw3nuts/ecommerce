import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth-guard');

// Define user interface to match JWT payload
export interface JwtUser {
  id: string;
  email: string;
  roles: string[];
  customerGroupIds?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

// Define request with auth user
export interface AuthenticatedRequest extends FastifyRequest {
  user?: JwtUser;
}

// JWT verification options
const jwtOptions = {
  algorithms: ['HS256'] as jwt.Algorithm[]
};

/**
 * Authentication middleware to validate JWT tokens
 * and attach user info to request
 */
export async function authGuard(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return reply.code(401).send({ message: 'Authorization header is required' });
    }
    
    // Extract token from Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Invalid authorization header format');
      return reply.code(401).send({ message: 'Invalid authorization format. Use: Bearer {token}' });
    }
    
    const token = parts[1];
    
    try {
      // Get JWT secret from environment variable
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET environment variable is not set');
        return reply.code(500).send({ message: 'Internal server error' });
      }
      
      // Verify token
      const decoded = jwt.verify(token, jwtSecret, jwtOptions) as JwtUser;
      
      // Attach user info to request
      request.user = decoded;
      
      // Log successful authentication
      logger.debug({ userId: decoded.id }, 'User authenticated');
      
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Token expired');
        return reply.code(401).send({ message: 'Token expired' });
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn({ error: error.message }, 'Invalid token');
        return reply.code(401).send({ message: 'Invalid token' });
      }
      
      logger.error({ error }, 'Error verifying token');
      return reply.code(401).send({ message: 'Authentication failed' });
    }
  } catch (error) {
    logger.error({ error }, 'Unexpected error in auth guard');
    return reply.code(500).send({ message: 'Internal server error' });
  }
}

/**
 * Middleware to check if user has required roles
 */
export function requireRoles(roles: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const user = request.user;
    
    if (!user) {
      logger.warn('User not authenticated');
      return reply.code(401).send({ message: 'Authentication required' });
    }
    
    const hasRequiredRole = user.roles.some(role => roles.includes(role));
    
    if (!hasRequiredRole) {
      logger.warn({ 
        userId: user.id,
        userRoles: user.roles,
        requiredRoles: roles
      }, 'Insufficient permissions');
      
      return reply.code(403).send({ message: 'Insufficient permissions' });
    }
    
    logger.debug({ userId: user.id, roles: user.roles }, 'User authorized with required roles');
  };
}

/**
 * Middleware to check if user has specific permissions
 */
export function requirePermissions(permissions: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const user = request.user;
    
    if (!user) {
      logger.warn('User not authenticated');
      return reply.code(401).send({ message: 'Authentication required' });
    }
    
    // Check if user has admin role (bypass permission check)
    if (user.roles.includes('admin')) {
      return;
    }
    
    // Check if user has required permissions
    const userPermissions = user.permissions || [];
    const hasRequiredPermission = permissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasRequiredPermission) {
      logger.warn({
        userId: user.id,
        userPermissions,
        requiredPermissions: permissions
      }, 'Insufficient permissions');
      
      return reply.code(403).send({ message: 'Insufficient permissions' });
    }
    
    logger.debug({ userId: user.id, permissions: userPermissions }, 'User authorized with required permissions');
  };
}

/**
 * Get customer group IDs from authenticated user
 */
export function getCustomerGroupIds(request: AuthenticatedRequest): string[] {
  const user = request.user;
  
  if (!user) {
    return [];
  }
  
  return user.customerGroupIds || [];
} 