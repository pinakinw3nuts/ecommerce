import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { env } from '../config/env';

interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
  // Standard JWT fields
  iat?: number;  // Issued at timestamp
  exp?: number;  // Expiration timestamp
  iss?: string;  // Issuer
  aud?: string;  // Audience
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    // Debug logging for all headers
    logger.info({
      path: request.url,
      method: request.method,
      headers: Object.keys(request.headers),
      hasAuth: !!authHeader,
    }, 'Request headers received');
    
    if (!authHeader) {
      logger.warn('Authorization header missing');
      return reply.code(401).send({ message: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      logger.warn('Token missing from authorization header');
      return reply.code(401).send({ message: 'No token provided' });
    }

    // Log the token's first few characters for debugging
    logger.info(`Token received (prefix): ${token.substring(0, 15)}...`);

    // Allow test/dev JWT bypass with a special token
    const isDevelopment = env.NODE_ENV === 'development';
    const isTestMode = request.headers['x-test-mode'] === 'true';
    
    if (isDevelopment && isTestMode && token === 'test-admin-token') {
      logger.warn('Using TEST admin token bypass (development only)');
      (request as any).user = {
        id: 'test-admin-id',
        email: 'test-admin@example.com',
        role: 'ADMIN'
      };
      return;
    }

    const jwtSecret = env.JWT_SECRET;
    
    try {
      // Parse token without verification first for debugging
      const decodedWithoutVerify = jwt.decode(token);
      logger.info({
        tokenData: decodedWithoutVerify,
        path: request.url
      }, 'Token decoded without verification');
      
      // For development and testing, accept any token with an admin role
      if (isDevelopment && decodedWithoutVerify && typeof decodedWithoutVerify === 'object' && decodedWithoutVerify.role === 'ADMIN') {
        logger.warn('Development mode: accepting token with ADMIN role without verification');
        (request as any).user = {
          id: decodedWithoutVerify.userId || 'dev-admin-id',
          email: decodedWithoutVerify.email || 'dev-admin@example.com',
          role: 'ADMIN'
        };
        return;
      }
      
      const decoded = jwt.verify(token, jwtSecret, {
        // Skip expiration check if configured to do so
        ignoreExpiration: !env.JWT_VERIFY_EXPIRATION,
        algorithms: ['HS256']
      }) as JwtPayload;

      // Log token details for debugging
      logger.info({
        userId: decoded.userId,
        role: decoded.role,
        path: request.url,
        iat: decoded.iat,
        exp: decoded.exp,
        issuer: decoded.iss,
        audience: decoded.aud
      }, 'Token verification successful');

      // Check for admin role if accessing admin endpoints
      if (request.url.includes('/admin/')) {
        if (decoded.role !== 'ADMIN') {
          logger.warn({
            userId: decoded.userId,
            role: decoded.role,
            path: request.url
          }, 'Non-admin user attempted to access admin endpoint');
          
          return reply.code(403).send({ 
            message: 'Admin privileges required', 
            code: 'FORBIDDEN' 
          });
        }
      }

      // Add user info to request
      (request as any).user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      
    } catch (jwtError) {
      // Enhanced error logging with more details
      if (jwtError instanceof jwt.JsonWebTokenError) {
        // Try to decode the token anyway for better debugging
        const decodedForDebug = jwt.decode(token);
        
        logger.error({ 
          error: jwtError.message,
          name: jwtError.name,
          token: token.substring(0, 15) + '...',
          decodedForDebug,
          jwtSecret: jwtSecret.substring(0, 3) + '...'
        }, 'JWT verification failed: Invalid token structure');
        
        // For development, accept any token with admin role even if verification fails
        if (isDevelopment) {
          const decodedAnyway = jwt.decode(token);
          if (decodedAnyway && typeof decodedAnyway === 'object' && decodedAnyway.role === 'ADMIN') {
            logger.warn('Development mode: accepting unverified token with ADMIN role');
            (request as any).user = {
              id: decodedAnyway.userId || 'unverified-admin-id',
              email: decodedAnyway.email || 'unverified-admin@example.com',
              role: 'ADMIN'
            };
            return;
          }
        }
        
        return reply.code(401).send({ 
          message: 'Invalid token structure: ' + jwtError.message, 
          code: 'TOKEN_INVALID',
          error: jwtError.name
        });
      } else if (jwtError instanceof jwt.TokenExpiredError) {
        const decodedExpired = jwt.decode(token) as any;
        logger.error({ 
          error: jwtError.message,
          name: jwtError.name,
          expiredAt: jwtError.expiredAt,
          decodedToken: decodedExpired ? {
            userId: decodedExpired.userId,
            exp: decodedExpired.exp,
            iat: decodedExpired.iat
          } : null
        }, 'JWT verification failed: Token expired');
        
        // In development, allow expired tokens with admin role
        if (isDevelopment && decodedExpired && decodedExpired.role === 'ADMIN') {
          logger.warn('Allowing expired token with ADMIN role in development mode');
          (request as any).user = {
            id: decodedExpired.userId || 'expired-admin-id',
            email: decodedExpired.email || 'expired-admin@example.com',
            role: 'ADMIN'
          };
          return;
        }
        
        return reply.code(401).send({ 
          message: 'Token has expired', 
          code: 'TOKEN_EXPIRED',
          expiredAt: jwtError.expiredAt
        });
      } else if (jwtError instanceof jwt.NotBeforeError) {
        logger.error({ error: jwtError.message, name: jwtError.name }, 'JWT verification failed: Token not active yet');
        return reply.code(401).send({ 
          message: 'Token not active yet', 
          code: 'TOKEN_NOT_ACTIVE'
        });
      } else {
        logger.error({ error: jwtError }, 'JWT verification failed: Unknown error');
        return reply.code(401).send({ 
          message: 'Invalid or expired token', 
          code: 'TOKEN_INVALID' 
        });
      }
    }
  } catch (error) {
    logger.error({ error }, 'Authentication middleware error');
    return reply.code(500).send({ 
      message: 'Internal server error', 
      code: 'SERVER_ERROR' 
    });
  }
} 