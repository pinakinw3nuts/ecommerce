import { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { createLogger } from './logger';

const logger = createLogger('jwt-utils');

// Define the JWT payload type
export interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Extend Fastify Request type to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

/**
 * Decodes and verifies a JWT token
 * @param token The JWT token to decode
 * @returns The decoded token payload or null if invalid
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    // Remove 'Bearer ' if present
    const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
    console.log('JWT Secret:', config.jwtSecret);
    console.log('Token to verify:', tokenString);

    // Verify and decode the token
    const decoded = jwt.verify(tokenString, config.jwtSecret) as JwtPayload;
    console.log('Successfully decoded token:', decoded);
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT Error:', error.message);
      logger.warn({ error: error.message }, 'Invalid JWT token');
    } else {
      console.error('Other Error:', error);
      logger.error({ error }, 'Error decoding JWT token');
    }
    return null;
  }
};

/**
 * Extracts token from request headers
 * @param req Fastify request object
 * @returns The token string or null if not found
 */
export const extractTokenFromHeader = (req: FastifyRequest): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

/**
 * Attaches user data to request if valid token is present
 * @param req Fastify request object
 * @returns boolean indicating if user was successfully attached
 */
export const attachUserToRequest = (req: FastifyRequest): boolean => {
  const token = extractTokenFromHeader(req);
  if (!token) {
    return false;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return false;
  }

  req.user = decoded;
  return true;
};

/**
 * Utility function to get user ID from request
 * @param req Fastify request object
 * @returns User ID or null if not authenticated
 */
export const getUserId = (req: FastifyRequest): string | null => {
  return req.user?.userId || null;
};

// Error class for authentication failures
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
} 