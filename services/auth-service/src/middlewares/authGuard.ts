import { preHandlerHookHandler } from 'fastify';
import { AccessTokenPayload, extractTokenFromHeader, verifyToken } from '../utils/jwt';
import logger from '../utils/logger';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenPayload;
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
export const authGuard = (options: AuthGuardOptions = {}): preHandlerHookHandler => {
  return async (request, reply) => {
    try {
      const token = extractTokenFromHeader(request.headers.authorization);

      if (!token) {
        if (options.optional) {
          return;
        }

        return reply.status(401).send({
          status: 'error',
          code: 'NO_TOKEN',
          message: 'No token provided'
        });
      }

      const verificationResult = verifyToken<AccessTokenPayload>(token);

      if (!verificationResult.valid) {
        return reply.status(401).send({
          status: 'error',
          code: verificationResult.expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
          message: verificationResult.expired ? 'Token has expired' : 'Invalid token'
        });
      }

      if (!verificationResult.payload) {
        return reply.status(401).send({
          status: 'error',
          code: 'INVALID_TOKEN',
          message: 'Invalid token payload'
        });
      }

      // Check roles if specified
      if (options.roles?.length && !options.roles.includes(verificationResult.payload.role)) {
        return reply.status(403).send({
          status: 'error',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions'
        });
      }

      // Attach user info to request
      request.user = verificationResult.payload;

    } catch (error) {
      authLogger.error('Auth guard error');
      return reply.status(500).send({
        status: 'error',
        code: 'AUTH_ERROR',
        message: 'Authentication error'
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