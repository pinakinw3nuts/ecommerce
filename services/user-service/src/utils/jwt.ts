import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import logger from './logger';
import { UserRole } from '../entities';

// Define the token payload type
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
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
    const decoded = jwt.verify(cleanToken, JWT_SECRET) as Omit<TokenPayload, 'role'> & { role: string };

    // Validate the required fields are present
    if (!decoded.userId || !decoded.role) {
      throw new Error('Invalid token payload: missing required fields');
    }

    // Validate and normalize role
    const normalizedRole = decoded.role.toUpperCase();
    if (!Object.values(UserRole).includes(normalizedRole as UserRole)) {
      throw new Error(`Invalid role in token: ${decoded.role}`);
    }

    const validatedPayload: TokenPayload = {
      ...decoded,
      role: normalizedRole as UserRole
    };

    logger.debug({ userId: decoded.userId, role: normalizedRole }, 'Token decoded successfully');
    return validatedPayload;
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