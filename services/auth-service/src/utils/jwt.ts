import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  version: number;
}

export interface VerifyTokenResult<T> {
  valid: boolean;
  expired: boolean;
  payload: T | null;
}

/**
 * Sign an access token
 * @param payload User information to include in the token
 * @returns Signed JWT access token
 */
export const signAccessToken = async (payload: TokenPayload): Promise<string> => {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn']
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

/**
 * Sign a refresh token
 * @param payload Refresh token payload
 * @returns Signed JWT refresh token
 */
export const signRefreshToken = async (payload: RefreshTokenPayload): Promise<string> => {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn']
  };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
};

/**
 * Verify and decode a JWT token
 * @param token JWT token to verify
 * @param isRefreshToken Whether this is a refresh token
 * @returns Object containing validation status and decoded payload
 */
export const verifyToken = <T extends object>(
  token: string,
  isRefreshToken = false
): VerifyTokenResult<T> => {
  try {
    const decoded = jwt.verify(
      token,
      isRefreshToken ? config.jwt.refreshSecret : config.jwt.secret
    ) as T;

    return {
      valid: true,
      expired: false,
      payload: decoded,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        expired: true,
        payload: null,
      };
    }

    return {
      valid: false,
      expired: false,
      payload: null,
    };
  }
};

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
    expiresIn: config.jwt.expiresIn,
    refreshExpiresIn: config.jwt.refreshExpiresIn,
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