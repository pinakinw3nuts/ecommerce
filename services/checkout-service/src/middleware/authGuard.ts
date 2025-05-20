import { FastifyRequest } from 'fastify';
import { verify } from 'jsonwebtoken';
import createError from 'http-errors';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { UserPayload } from '../types/auth';

/**
 * Extracts the token from the Authorization header
 */
const extractToken = (request: FastifyRequest): string => {
  const authHeader = request.headers.authorization;
  
  if (!authHeader) {
    throw createError(401, 'No authorization header');
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    throw createError(401, 'Invalid authorization header format');
  }

  return token;
};

/**
 * Verifies the JWT token and returns the decoded payload
 */
const verifyToken = (token: string): UserPayload => {
  try {
    const decoded = verify(token, config.jwt.secret);
    if (typeof decoded === 'string' || !('id' in decoded)) {
      throw new Error('Invalid token payload');
    }
    return decoded as UserPayload;
  } catch (error) {
    logger.error({ error }, 'Token verification failed');
    throw createError(401, 'Invalid token');
  }
};

/**
 * Authentication guard middleware
 * Verifies JWT from Authorization header and attaches user data to request
 */
export const authGuard = async (
  request: FastifyRequest
) => {
  try {
    const token = extractToken(request);
    const decoded = verifyToken(token);

    // Attach user data to request
    request.user = decoded;

    logger.debug({ userId: decoded.id }, 'User authenticated');
  } catch (error) {
    logger.error({ 
      error,
      path: request.url,
      method: request.method
    }, 'Authentication failed');

    if (error instanceof Error) {
      throw createError(401, error.message);
    }
    throw error;
  }
};

/**
 * Role-based authorization guard
 * Ensures the authenticated user has one of the allowed roles
 */
export const requireRoles = (allowedRoles: string[]) => {
  return async (request: FastifyRequest) => {
    const user = request.user as UserPayload;
    if (!user) {
      throw createError(401, 'User not authenticated');
    }

    const hasRequiredRole = allowedRoles.includes(user.role);

    if (!hasRequiredRole) {
      logger.warn({
        userId: user.id,
        userRole: user.role,
        requiredRoles: allowedRoles
      }, 'Insufficient permissions');
      
      throw createError(403, 'Insufficient permissions');
    }

    logger.debug({
      userId: user.id,
      role: user.role
    }, 'Role check passed');
  };
};

// Export types
export type { UserPayload }; 