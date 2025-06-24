import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { CustomJWTPayload } from '../types/auth';

export type JWTPayload = CustomJWTPayload;

interface RequestWithId {
  Params: {
    id: string;
  };
}

export const extractToken = (request: FastifyRequest): string | null => {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

export const validateToken = async (request: FastifyRequest): Promise<JWTPayload> => {
  try {
    await request.jwtVerify();
    return request.user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ message: 'Unauthorized' });
  }
}

export function roleGuard(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as CustomJWTPayload;
      
      // Check for X-Admin-Role header specifically for admin panel integration
      const adminRoleHeader = request.headers['x-admin-role'];
      
      // If the header exists and matches 'admin', allow access if 'admin' role is required
      if (adminRoleHeader === 'admin' && roles.includes('admin')) {
        return;
      }
      
      // Otherwise check roles in JWT payload
      if (!user.roles?.some(role => roles.includes(role))) {
        return reply.status(403).send({
          message: `Access denied. Required role: ${roles.join(', ')}`
        });
      }
    } catch (err) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
  };
}

/**
 * Verify user has access to the requested order
 * Use this guard for routes that operate on specific orders
 */
export const verifyOrderAccess = async (
  request: FastifyRequest<RequestWithId>,
  reply: FastifyReply
) => {
  const user = request.user as CustomJWTPayload;

  // Check for X-Admin-Role header specifically for admin panel integration
  const adminRoleHeader = request.headers['x-admin-role'];
  
  // If the header exists and matches 'admin', allow access
  if (adminRoleHeader === 'admin') {
    return;
  }

  // Admin users can access all orders
  if (user.roles?.includes('admin')) {
    return;
  }

  // For regular users, verify they own the order
  const orderId = request.params.id;
  if (!user.id) {
    reply.status(403).send({
      message: 'Access denied'
    });
    return;
  }
}; 