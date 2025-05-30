import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from './authGuard';
import { logger } from '../utils/logger';

/**
 * Middleware to check if user has required role
 * @param requiredRoles - Single role or array of roles that are allowed
 */
export function roleGuard(requiredRoles: string | string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      
      // Ensure user exists on request (should be set by authGuard)
      if (!authRequest.user) {
        logger.warn('Role guard called but no user found on request');
        return reply.code(401).send({
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }
      
      const userRole = authRequest.user.role;
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      // Check if user has one of the required roles
      if (!roles.includes(userRole)) {
        logger.warn({ 
          userId: authRequest.user.id,
          userRole,
          requiredRoles: roles
        }, 'Insufficient permissions');
        
        return reply.code(403).send({
          message: 'Insufficient permissions to access this resource',
          code: 'FORBIDDEN'
        });
      }
      
      // User has required role, continue
      logger.debug({ 
        userId: authRequest.user.id,
        userRole,
        requiredRoles: roles
      }, 'Role check passed');
    } catch (error) {
      logger.error({ error }, 'Error in role guard');
      return reply.code(500).send({
        message: 'Internal server error during authorization',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
} 