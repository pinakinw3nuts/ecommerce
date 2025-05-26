import jwt from 'jsonwebtoken';
import { configTyped } from '../config/env';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  version: number;
}

export interface TokenVerificationResult<T = any> {
  valid: boolean;
  expired: boolean;
  payload: T | null;
  error?: string;
}

/**
 * Sign access token
 */
export async function signAccessToken(
  payload: AccessTokenPayload
): Promise<string> {
  const options: jwt.SignOptions = {
    expiresIn: configTyped.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    audience: 'user-service',
    issuer: 'auth-service'
  };

  return jwt.sign(payload, configTyped.jwt.secret, options);
}

/**
 * Sign refresh token
 */
export async function signRefreshToken(
  payload: RefreshTokenPayload
): Promise<string> {
  const options: jwt.SignOptions = {
    expiresIn: configTyped.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    audience: 'user-service',
    issuer: 'auth-service'
  };

  return jwt.sign(payload, configTyped.jwt.refreshSecret, options);
}

/**
 * Verify JWT token
 */
export function verifyToken<T = any>(
  token: string,
  isRefreshToken = false
): TokenVerificationResult<T> {
  try {
    const secret = isRefreshToken ? configTyped.jwt.refreshSecret : configTyped.jwt.secret;
    const payload = jwt.verify(token, secret, {
      audience: 'user-service',
      issuer: 'auth-service'
    }) as T;

    return {
      valid: true,
      expired: false,
      payload
    };
  } catch (error) {
    return {
      valid: false,
      expired: error instanceof jwt.TokenExpiredError,
      payload: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate both access and refresh tokens for a user
 * @param user User information for token generation
 * @returns Object containing both tokens and their expiration times
 */
export const generateAuthTokens = async (user: {
  _id: string;
  email: string;
  role: string;
  tokenVersion?: number;
}) => {
  const accessToken = await signAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = await signRefreshToken({
    userId: user._id,
    version: user.tokenVersion || 0,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: configTyped.jwt.expiresIn,
    refreshExpiresIn: configTyped.jwt.refreshExpiresIn,
  };
};

/**
 * Extract token from authorization header
 * @param authHeader Authorization header value
 * @returns Extracted token or null
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7); // Remove 'Bearer ' prefix
};

/**
 * Decode a token without verifying it
 * Useful for getting payload information when verification isn't needed
 * @param token JWT token to decode
 * @returns Decoded token payload or null
 */
export const decodeToken = <T extends object>(token: string): T | null => {
  try {
    return jwt.decode(token) as T;
  } catch {
    return null;
  }
}; 