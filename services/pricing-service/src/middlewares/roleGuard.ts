import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from './auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('role-guard');

/**
 * Role-based guard middleware
 * 
 * @param allowedRoles Array of roles that are allowed to access the route
 * @returns Middleware function that checks if the user has the required role
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