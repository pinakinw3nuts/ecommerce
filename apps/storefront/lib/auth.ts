import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// JWT secret key - should match the one used in auth-service
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Token payload type
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Get access token from request cookies
 */
export function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('accessToken')?.value;
}

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    // Verify token using the secret key
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Return the decoded payload
    return decoded as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}

/**
 * Parse an authorization header to extract the token
 */
export function parseAuthHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Extract the token part (remove 'Bearer ' prefix)
  return authHeader.substring(7);
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwt.decode(token) as { exp: number };
    const currentTime = Math.floor(Date.now() / 1000);
    
    return exp < currentTime;
  } catch {
    // If we can't decode the token, consider it expired
    return true;
  }
} 