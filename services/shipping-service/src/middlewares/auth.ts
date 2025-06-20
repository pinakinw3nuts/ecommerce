import fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AuthUser } from './authGuard';

// Type definitions for Fastify
type FastifyRequest = any;
type FastifyReply = any;

// Define JWT payload type
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

/**
 * Authentication middleware for validating JWT tokens
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
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
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      
      // Add user data to request
      request.user = {
        userId: decoded.userId,
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      
      return;
    } catch (err) {
      logger.error({
        msg: 'JWT verification failed',
        error: err instanceof Error ? err.message : String(err)
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
      error: error instanceof Error ? error.message : String(error),
      request: {
        url: request.url || 'unknown',
        method: request.method || 'unknown'
      }
    });
    
    return reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Authentication error'
    });
  }
}

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed roles
 * @returns Middleware function for Fastify
 */
export function authorize(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      // Check if user exists in request (should be set by authenticate middleware)
      if (!request.user) {
        throw new Error('User not authenticated');
      }
      
      // Check if user has required role (case-insensitive)
      const userRole = (request.user.role || 'user').toLowerCase();
      const normalizedRoles = roles.map(role => role.toLowerCase());
      
      if (!normalizedRoles.includes(userRole)) {
        logger.warn({
          userId: request.user.userId,
          userRole: request.user.role,
          requiredRoles: roles,
          url: request.url
        }, 'Authorization failed - insufficient permissions');
        
        throw new Error('Insufficient permissions');
      }
    } catch (error) {
      reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }
  };
} 