import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

interface UserInfo {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const publicRoutes = [
      '/health',
      '/docs',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
    ];
    
    // Check for exact public routes first
    const isPublicRoute = publicRoutes.some(route =>
      request.url.startsWith(route)
    );
    
    // Allow GET requests to products, categories, brands (read-only access)
    const isPublicGetRoute = request.method === 'GET' && (
      request.url.startsWith('/api/products') ||
      request.url.startsWith('/api/categories') ||
      request.url.startsWith('/api/brands')
    );
    
    if (isPublicRoute || isPublicGetRoute) {
      return;
    }
    
    await request.jwtVerify();
    const userInfo = request.user as UserInfo;
    logger.debug({ userId: userInfo?.id }, 'User authenticated');
  } catch (error) {
    logger.warn('Authentication failed', { error: (error as Error).message });
    return reply.status(401).send({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED',
    });
  }
}

export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userInfo = request.user as UserInfo;
    if (!userInfo) {
      return reply.status(401).send({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
      });
    }
    
    if (!roles.includes(userInfo.role)) {
      return reply.status(403).send({
        success: false,
        message: 'Insufficient permissions',
        error: 'FORBIDDEN',
      });
    }
  };
}

export function requireAdmin() {
  return requireRole(['ADMIN']);
}

export function requireUser() {
  return requireRole(['USER', 'ADMIN']);
} 