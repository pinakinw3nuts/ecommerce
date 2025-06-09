import { FastifyRequest, FastifyReply } from 'fastify';
import { apiLogger } from '../utils/logger';

/**
 * User type from JWT verification
 */
export interface JwtUser {
  id: string;
  email: string;
  roles: string[];
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  id: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * Authentication guard middleware
 * Verifies the JWT token from the Authorization header
 */
export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Check if auth decorator exists (added by JWT plugin)
    if (!request.server.hasDecorator('auth')) {
      apiLogger.error('Auth decorator not found on server instance');
      return reply.code(500).send({ message: 'Server configuration error' });
    }

    // Verify JWT token - this will be handled by the JWT plugin
    // The JWT plugin will add the user property to the request
    await request.jwtVerify();

    // If we get here, the token is valid
    const user = request.user as JwtUser;
    apiLogger.info({ userId: user.id }, 'User authenticated');
  } catch (error) {
    apiLogger.warn({ error }, 'Authentication failed');
    return reply.code(401).send({ message: 'Authentication required' });
  }
} 