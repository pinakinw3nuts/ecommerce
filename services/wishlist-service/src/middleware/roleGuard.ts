import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

/**
 * Role-based guard middleware that checks if the user has the required role
 * 
 * @param requiredRole - The role required to access the route
 * @returns A middleware function that checks the user's roles
 */
export function roleGuard(requiredRole: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get the authenticated user from the request
      // This assumes the authGuard middleware has already run
      const user = request.user as unknown as { id: string; roles?: string[] };
      
      // Check if the user has the required role
      if (!user?.id || !user.roles?.includes(requiredRole)) {
        logger.warn('Access denied - insufficient permissions', {
          userId: user?.id,
          requiredRole,
          userRoles: user?.roles || [],
          url: request.url,
          method: request.method
        });
        
        return reply.status(403).send({
          message: `Access denied. Required role: ${requiredRole}`,
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // Log successful role check
      logger.debug('Role check passed', {
        userId: user.id,
        requiredRole,
        url: request.url,
        method: request.method
      });
      
      // Continue to route handler
    } catch (error) {
      logger.error('Role check error', {
        requiredRole,
        url: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(401).send({
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }
  };
} 