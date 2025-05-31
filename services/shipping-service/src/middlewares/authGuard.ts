import fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Type definitions for Fastify
type FastifyRequest = any;
type FastifyReply = any;

/**
 * User information from JWT token
 */
export interface AuthUser {
  userId: string;
  id: string;
  email: string;
  role: string;
}

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

/**
 * Authentication guard middleware
 * Validates JWT token and adds user to request
 */
export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Skip authentication for swagger docs
    if (request.url?.startsWith('/docs')) {
      return;
    }

    const authHeader = request.headers?.authorization;
    
    if (!authHeader) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid token format'
      });
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      
      // Add user data to request
      request.user = {
        userId: decoded.userId,
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      
      return;
    } catch (error) {
      logger.error({
        msg: 'JWT verification failed',
        error: error instanceof Error ? error.message : String(error)
      });
      
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    logger.error({
      msg: 'Authentication error',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Authentication error'
    });
  }
}

/**
 * Role-based authorization guard
 * Ensures the authenticated user has the required roles
 * @param requiredRoles - Array of roles that are allowed to access the route
 */
export function roleGuard(requiredRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // First ensure the user is authenticated
    if (!request.user) {
      logger.warn('Unauthenticated request in role guard');
      reply.code(401).send({ message: 'Unauthorized: Authentication required' });
      return;
    }

    // Check if the user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => 
      request.user?.roles.includes(role)
    );

    if (!hasRequiredRole) {
      logger.warn({
        userId: request.user.id,
        userRoles: request.user.roles,
        requiredRoles
      }, 'Insufficient permissions');
      
      reply.code(403).send({ message: 'Forbidden: Insufficient permissions' });
      return;
    }

    logger.debug({
      userId: request.user.id,
      roles: request.user.roles
    }, 'Authorization successful');
  };
} 