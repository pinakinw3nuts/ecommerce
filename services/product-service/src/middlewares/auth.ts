import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

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

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

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
        logger.error({ 
          error: jwtError.message,
          name: jwtError.name,
          token: token.substring(0, 15) + '...'
        }, 'JWT verification failed: Invalid token structure');
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