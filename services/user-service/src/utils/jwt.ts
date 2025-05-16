import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import logger from './logger';

// Define the token payload type
export interface TokenPayload {
  userId: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

/**
 * Decodes and verifies a JWT token
 * @param token - The JWT token to decode
 * @returns The decoded token payload
 * @throws {Error} If token is invalid or verification fails
 */
export const decodeToken = (token: string): TokenPayload => {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    // Verify and decode the token
    const decoded = jwt.verify(cleanToken, JWT_SECRET) as TokenPayload;

    // Validate the required fields are present
    if (!decoded.userId || !decoded.role) {
      throw new Error('Invalid token payload: missing required fields');
    }

    // Validate role is one of the allowed values
    if (!['user', 'admin'].includes(decoded.role)) {
      throw new Error('Invalid token payload: invalid role');
    }

    logger.debug({ userId: decoded.userId, role: decoded.role }, 'Token decoded successfully');
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.error({ error: error.message }, 'JWT verification failed');
      throw new Error('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.error('Token has expired');
      throw new Error('Token expired');
    }
    logger.error({ error }, 'Token decoding failed');
    throw error;
  }
};

// Example usage:
/*
try {
  const token = 'Bearer eyJhbGc...'; // JWT token from request header
  const { userId, role } = decodeToken(token);
  // Use decoded information
} catch (error) {
  // Handle invalid token error
}
*/ 