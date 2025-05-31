import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import { authLogger } from '../utils/logger';

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
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Skip auth for development if configured
    if (config.isDevelopment && process.env.SKIP_AUTH === 'true') {
      request.user = {
        id: 'dev-user',
        email: 'dev@example.com',
        roles: ['user', 'admin']
      };
      return;
    }

    // Check for Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ message: 'Authorization header missing' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return reply.code(401).send({ message: 'Bearer token missing' });
    }

    try {
      // Verify token - use jwtVerify instead of jwt.verify
      const decoded = await request.jwtVerify<JwtPayload>();
      
      // Add user to request
      request.user = decoded;
      
      authLogger.debug({ userId: decoded.id }, 'User authenticated');
    } catch (jwtError) {
      authLogger.warn({ error: jwtError }, 'JWT verification failed');
      return reply.code(401).send({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    authLogger.error({ error }, 'Authentication error');
    return reply.code(500).send({ message: 'Authentication error' });
  }
} 