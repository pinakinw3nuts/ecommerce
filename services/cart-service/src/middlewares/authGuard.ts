import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { attachUserToRequest, AuthenticationError } from '../utils/jwt';
import { createLogger } from '../utils/logger';

const logger = createLogger('authGuard');

/**
 * Authentication guard middleware
 * Verifies JWT token and attaches user to request
 */
export const authGuard = (
  req: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) => {
  try {
    if (!attachUserToRequest(req)) {
      logger.warn({ url: req.url }, 'Authentication failed - invalid or missing token');
      reply.code(401).send({ error: 'Authentication required' });
      return;
    }
    done();
  } catch (error) {
    logger.error({ error, url: req.url }, 'Authentication error');
    reply.code(500).send({
      status: 'error',
      message: 'Internal server error during authentication',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require authentication
 */
export const optionalAuth = (
  req: FastifyRequest,
  _reply: FastifyReply,
  done: HookHandlerDoneFunction
) => {
  try {
    attachUserToRequest(req);
    done();
  } catch (error) {
    logger.error({ error, url: req.url }, 'Optional authentication error');
    done();
  }
};

/**
 * Role-based authentication guard
 * Verifies JWT token and checks if user has required role
 */
export const roleGuard = (allowedRoles: string[]) => {
  return (req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    try {
      if (!attachUserToRequest(req)) {
        logger.warn({ url: req.url }, 'Role check failed - invalid or missing token');
        reply.code(401).send({ error: 'Authentication required' });
        return;
      }

      const userRole = req.user?.role;
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        logger.warn({
          url: req.url,
          userRole,
          allowedRoles,
        }, 'Role check failed - insufficient permissions');
        
        reply.code(403).send({
          status: 'error',
          message: 'Insufficient permissions',
        });
        return;
      }

      done();
    } catch (error) {
      logger.error({ error, url: req.url }, 'Role guard error');
      reply.code(500).send({
        status: 'error',
        message: 'Internal server error during authorization',
      });
    }
  };
};

// Convenience role guard instances
export const adminGuard = roleGuard(['admin']);
export const customerGuard = roleGuard(['customer', 'admin']);

// Types for middleware configuration
export type AuthConfig = {
  requireAuth?: boolean;
  roles?: string[];
};

/**
 * Configurable authentication middleware factory
 * Creates middleware based on provided configuration
 */
export const createAuthMiddleware = (config: AuthConfig = {}) => {
  const { requireAuth = true, roles } = config;

  if (roles && roles.length > 0) {
    return roleGuard(roles);
  }

  return requireAuth ? authGuard : optionalAuth;
};

// Error handler middleware for authentication errors
export const authErrorHandler = (
  error: Error,
  req: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) => {
  if (error instanceof AuthenticationError) {
    logger.warn({
      error: error.message,
      url: req.url,
    }, 'Authentication error caught');

    reply.code(401).send({
      status: 'error',
      message: error.message,
    });
  }

  done(error);
}; 