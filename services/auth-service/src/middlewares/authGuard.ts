import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenPayload, extractTokenFromHeader, verifyToken } from '../utils/jwt';
import logger from '../utils/logger';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export interface AuthGuardOptions {
  optional?: boolean;
  roles?: string[];
}

const authLogger = logger.child({ module: 'auth-guard' });

/**
 * Authentication guard middleware for Fastify
 * Verifies JWT tokens and attaches user information to the request
 */
export const authGuard = (options: AuthGuardOptions = {}) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = extractTokenFromHeader(request.headers.authorization);

      if (!token) {
        if (options.optional) {
          return;
        }
        
        authLogger.warn('No authorization token provided');
        return reply.status(401).send({
          status: 'error',
          message: 'Authorization token is required'
        });
      }

      const { valid, expired, payload } = verifyToken<TokenPayload>(token);

      if (!valid) {
        authLogger.warn({ expired }, 'Invalid token');
        return reply.status(401).send({
          status: 'error',
          message: expired ? 'Token has expired' : 'Invalid token'
        });
      }

      if (!payload) {
        authLogger.error('Token payload is missing');
        return reply.status(401).send({
          status: 'error',
          message: 'Invalid token payload'
        });
      }

      // Check role requirements if specified
      if (options.roles?.length && !options.roles.includes(payload.role)) {
        authLogger.warn({
          userRole: payload.role,
          requiredRoles: options.roles
        }, 'Insufficient permissions');
        
        return reply.status(403).send({
          status: 'error',
          message: 'Insufficient permissions'
        });
      }

      // Attach user information to request
      request.user = payload;
      
      authLogger.debug({ userId: payload.userId }, 'User authenticated successfully');

    } catch (error) {
      authLogger.error({ error }, 'Error processing authentication');
      return reply.status(500).send({
        status: 'error',
        message: 'Internal server error during authentication'
      });
    }
  };
};

/**
 * Helper function to create role-specific guards
 */
export const createRoleGuard = (roles: string[]) => {
  return authGuard({ roles });
};

// Commonly used guard instances
export const adminGuard = createRoleGuard(['admin']);
export const userGuard = authGuard();
export const optionalAuthGuard = authGuard({ optional: true }); 