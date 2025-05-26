import jwt from 'jsonwebtoken';
import { UserRole } from '../entities/user.entity';
import logger from '../utils/logger';

// Load JWT configuration from environment variables with fallbacks
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  issuer: process.env.JWT_ISSUER || 'auth-service',
  audience: process.env.JWT_AUDIENCE || 'user-service',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h'
};

if (process.env.NODE_ENV === 'production' && JWT_CONFIG.secret === 'your-super-secret-jwt-key-change-in-production') {
  logger.warn('Using default JWT secret in production environment');
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Extend FastifyRequest to include user property
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: TokenPayload
  }
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    }) as Omit<TokenPayload, 'role'> & { role: string };

    if (!decoded.userId || !decoded.email || !decoded.role) {
      logger.warn({ decoded }, 'Missing required fields in token payload');
      throw new Error('Invalid token payload');
    }

    // Normalize role to uppercase to match UserRole enum
    const normalizedRole = decoded.role.toUpperCase();
    if (!Object.values(UserRole).includes(normalizedRole as UserRole)) {
      logger.warn({ role: decoded.role }, 'Invalid role in token');
      throw new Error(`Invalid role in token: ${decoded.role}`);
    }

    return {
      ...decoded,
      role: normalizedRole as UserRole
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token has expired');
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn({ error: error.message }, 'JWT verification failed');
      throw new Error('Invalid token');
    }
    logger.error(error, 'Token verification failed');
    throw error;
  }
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
    const decoded = jwt.verify(cleanToken, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    }) as Omit<TokenPayload, 'role'> & { role: string };

    // Validate the required fields are present
    if (!decoded.userId || !decoded.role) {
      logger.warn({ decoded }, 'Missing required fields in token payload');
      throw new Error('Invalid token payload: missing required fields');
    }

    // Validate and normalize role
    const normalizedRole = decoded.role.toUpperCase();
    if (!Object.values(UserRole).includes(normalizedRole as UserRole)) {
      logger.warn({ role: decoded.role }, 'Invalid role in token');
      throw new Error(`Invalid role in token: ${decoded.role}`);
    }

    const validatedPayload: TokenPayload = {
      ...decoded,
      role: normalizedRole as UserRole
    };

    return validatedPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn({ error: error.message }, 'Invalid token structure');
      throw new Error('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token has expired');
      throw new Error('Token expired');
    }
    logger.error(error, 'Token verification failed');
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