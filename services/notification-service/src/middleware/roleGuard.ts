import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { User } from '../types/fastify';

/**
 * Middleware that checks if the authenticated user has one of the required roles
 * 
 * @param requiredRoles - Array of roles that are allowed to access the route
 */
export function roleGuard(requiredRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Request should already be authenticated by authGuard
      const user = request.user;
      
      // If no roles specified or empty array, allow access
      if (!requiredRoles || requiredRoles.length === 0) {
        return;
      }
      
      // If user has no roles, deny access
      if (!user.roles || user.roles.length === 0) {
        logger.warn('Access denied: user has no roles', {
          userId: user.id,
          requiredRoles,
          url: request.url,
          method: request.method
        });
        
        return reply.status(403).send({
          message: 'Insufficient permissions',
          error: 'FORBIDDEN'
        });
      }
      
      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.some(role => 
        user.roles?.includes(role)
      );
      
      if (!hasRequiredRole) {
        logger.warn('Access denied: user lacks required role', {
          userId: user.id,
          userRoles: user.roles,
          requiredRoles,
          url: request.url,
          method: request.method
        });
        
        return reply.status(403).send({
          message: 'Insufficient permissions',
          error: 'FORBIDDEN'
        });
      }
      
      // User has required role, continue to route handler
      logger.debug('Role check passed', {
        userId: user.id,
        userRoles: user.roles,
        requiredRoles,
        url: request.url
      });
    } catch (error) {
      // Log role check failure
      logger.error('Role check failed', {
        url: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        message: 'Failed to verify permissions',
        error: 'ROLE_CHECK_FAILED'
      });
    }
  };
} 