import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ message: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return reply.code(401).send({ message: 'No token provided' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      // Log token details for debugging
      logger.debug({
        userId: decoded.userId,
        role: decoded.role,
        path: request.url
      }, 'Token verification');

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
      logger.error({ error: jwtError, token: token.substring(0, 10) + '...' }, 'JWT verification failed');
      return reply.code(401).send({ 
        message: 'Invalid or expired token', 
        code: 'TOKEN_INVALID' 
      });
    }
  } catch (error) {
    logger.error({ error }, 'Authentication middleware error');
    return reply.code(500).send({ 
      message: 'Internal server error', 
      code: 'SERVER_ERROR' 
    });
  }
} 