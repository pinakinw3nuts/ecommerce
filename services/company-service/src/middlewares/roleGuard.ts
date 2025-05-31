import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { RequestUser } from './authGuard';

/**
 * Middleware factory that creates a role-based authorization guard
 * 
 * @param allowedRoles Array of roles that are allowed to access the route
 * @returns Middleware function that checks if the user has the required role
 */
export function roleGuard(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Check if user is attached to request (authGuard should run first)
    if (!request.user) {
      logger.warn({
        requestId: request.id,
        path: request.url
      }, 'Role guard: No user attached to request');
      
      return reply.status(401).send({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
    }

    const user = request.user as RequestUser;
    const userRole = user.role;
    
    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(userRole || '')) {
      logger.warn({
        requestId: request.id,
        userId: user.id,
        userRole,
        allowedRoles,
        path: request.url
      }, 'Role guard: User does not have required role');
      
      return reply.status(403).send({
        success: false,
        message: 'You do not have permission to access this resource',
        error: 'FORBIDDEN'
      });
    }

    // If we get here, the user has the required role
    logger.debug({
      requestId: request.id,
      userId: user.id,
      userRole,
      path: request.url
    }, 'Role guard: Access granted');
  };
}

/**
 * Middleware factory that creates a company role-based authorization guard
 * This is for routes that require specific roles within a company
 * 
 * @param allowedRoles Array of company roles that are allowed to access the route
 * @returns Middleware function that checks if the user has the required company role
 */
export function companyRoleGuard(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Check if user is attached to request (authGuard should run first)
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
    }

    const user = request.user as RequestUser;
    
    // Get the company role from the user
    const companyRole = user.companyRole;
    
    // If no company role, deny access
    if (!companyRole) {
      return reply.status(403).send({
        success: false,
        message: 'You are not associated with any company',
        error: 'NO_COMPANY_ROLE'
      });
    }

    // Check if user has one of the allowed company roles
    if (!allowedRoles.includes(companyRole)) {
      logger.warn({
        requestId: request.id,
        userId: user.id,
        companyRole,
        allowedRoles,
        path: request.url
      }, 'Company role guard: User does not have required company role');
      
      return reply.status(403).send({
        success: false,
        message: 'You do not have the required role in this company',
        error: 'FORBIDDEN'
      });
    }

    // If we get here, the user has the required company role
    logger.debug({
      requestId: request.id,
      userId: user.id,
      companyRole,
      path: request.url
    }, 'Company role guard: Access granted');
  };
} 