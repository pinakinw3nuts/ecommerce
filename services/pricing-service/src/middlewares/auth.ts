import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger';
import { env } from '../config/env';

const logger = createLogger('auth-middleware');

interface JwtPayload {
  id: string;
  email: string;
  roles?: string[];
  customerGroups?: string[];
  exp: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    roles: string[];
    customerGroups: string[];
  };
}

/**
 * Authentication middleware that validates JWT tokens
 */
export async function authMiddleware(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    // Get the authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authorization header missing'
      });
    }
    
    // Check if it's a bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid authorization format. Expected Bearer token'
      });
    }
    
    // Extract the token
    const token = authHeader.substring(7);
    
    // Verify the token
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }
    
    // Set user in request
    request.user = {
      id: payload.id,
      email: payload.email,
      roles: payload.roles || [],
      customerGroups: payload.customerGroups || []
    };
    
    logger.debug({ userId: payload.id }, 'User authenticated');
    
  } catch (error) {
    logger.error({ error }, 'Authentication error');
    
    return reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
}

/**
 * Get customer group IDs from authenticated request
 */
export function getCustomerGroupIds(request: AuthenticatedRequest): string[] {
  return request.user?.customerGroups || [];
}

/**
 * Role-based guard middleware
 */
export function roleGuard(allowedRoles: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    
    const hasRole = request.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      logger.warn({ 
        userId: request.user.id,
        userRoles: request.user.roles,
        requiredRoles: allowedRoles
      }, 'Access denied - insufficient permissions');
      
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }
    
    logger.debug({ 
      userId: request.user.id,
      roles: request.user.roles
    }, 'Role check passed');
  };
}

/**
 * Admin guard middleware (shorthand for role guard with admin role)
 */
export const adminGuard = roleGuard(['admin']); 