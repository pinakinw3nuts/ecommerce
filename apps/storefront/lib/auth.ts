import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from './constants';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

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
 * Checks both the httpOnly and client-accessible cookies
 */
export function getAccessToken(request: NextRequest): string | undefined {
  // Try the standard cookie first, then the client-accessible one
  return request.cookies.get(ACCESS_TOKEN_NAME)?.value || 
         request.cookies.get(`${ACCESS_TOKEN_NAME}_client`)?.value;
}

/**
 * Get refresh token from request cookies
 * Checks both the httpOnly and client-accessible cookies
 */
export function getRefreshToken(request: NextRequest): string | undefined {
  // Try the standard cookie first, then the client-accessible one
  return request.cookies.get(REFRESH_TOKEN_NAME)?.value || 
         request.cookies.get(`${REFRESH_TOKEN_NAME}_client`)?.value;
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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          const response = await fetch(`${process.env.AUTH_SERVICE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            throw new Error('Invalid credentials');
          }

          const data = await response.json();
          
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            accessToken: data.accessToken,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        if (session.user) {
          session.user.id = token.id as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
}; 