import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';
import { JwtUser } from '../types/fastify';

/**
 * Role-based authorization middleware for Fastify
 * 
 * @param allowedRoles - Array of roles allowed to access the route
 * @returns Middleware function that checks if the user has the required role
 */
export function roleGuard(allowedRoles: string[]) {
  // Log when the middleware is created
  logger.debug('Creating roleGuard middleware', { allowedRoles });
  
  return async (request: FastifyRequest, reply: FastifyReply, done?: Function) => {
    try {
      logger.debug('roleGuard middleware executing', { 
        path: request.url,
        method: request.method,
        allowedRoles
      });
      
      // Get the authenticated user from the request with type assertion
      const user = request.user as JwtUser | undefined;
      
      // If no user or no roles, deny access
      if (!user || !user.roles) {
        logger.warn('Role guard: No user or roles found in request', {
          path: request.url,
          method: request.method,
          user: user ? 'exists' : 'missing',
          roles: user && user.roles ? 'exists' : 'missing'
        });
        
        reply.status(403).send({
          success: false,
          message: 'Access denied: insufficient permissions',
          error: 'FORBIDDEN'
        });
        return;
      }
      
      // Check if the user has any of the allowed roles
      const hasRequiredRole = user.roles.some((role: string) => allowedRoles.includes(role));
      
      if (!hasRequiredRole) {
        logger.warn('Role guard: User does not have required role', {
          path: request.url,
          method: request.method,
          userRoles: user.roles,
          requiredRoles: allowedRoles
        });
        
        reply.status(403).send({
          success: false,
          message: 'Access denied: insufficient permissions',
          error: 'FORBIDDEN'
        });
        return;
      }
      
      // User has the required role, continue to the route handler
      logger.debug('roleGuard: Access granted', {
        path: request.url,
        method: request.method,
        userRoles: user.roles
      });
      
      // Call done if provided (for middleware compatibility)
      if (typeof done === 'function') {
        done();
      }
    } catch (error) {
      logger.error('Role guard: Error checking user roles', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path: request.url,
        method: request.method
      });
      
      reply.status(500).send({
        success: false,
        message: 'Internal server error during authorization',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
} 