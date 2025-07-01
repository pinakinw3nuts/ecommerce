import { FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '../utils/logger'
import { config } from '../config/env'
import jwt from 'jsonwebtoken'

const authLogger = logger.child({ module: 'AuthGuard' })

// Create a custom interface for authenticated requests
export interface AuthRequest extends FastifyRequest {
  user: {
    userId: string
    role?: string
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply, done?: () => void) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      reply.code(401).send({ message: 'No authorization header' });
      return done ? done() : undefined;
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      reply.code(401).send({ message: 'No token provided' });
      return done ? done() : undefined;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    (request as any).user = {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    // If this is an admin route, enforce admin role
    if (request.url.includes('/admin/')) {
      if (decoded.role !== 'ADMIN') {
        reply.code(403).send({ message: 'Admin privileges required' });
        return done ? done() : undefined;
      }
    }
    
    if (done) done();
  } catch (error) {
    logger.error({ error }, 'Authentication failed');
    reply.code(401).send({ message: 'Invalid or expired token' });
    return done ? done() : undefined;
  }
}

// Check if the user is an admin
export const isAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authRequest = request as AuthRequest;
    
    // Check if user exists and has a role
    if (!authRequest.user || !authRequest.user.role) {
      // If role is not in the token, try to fetch it
      const userRole = await getUserRoleById(authRequest.user?.userId || '');
      
      if (userRole !== 'admin') {
        authLogger.warn({
          userId: authRequest.user?.userId,
          role: userRole
        }, 'Admin access denied');
        
        return reply.status(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required',
          timestamp: new Date().toISOString()
        });
      }
    } else if (authRequest.user.role !== 'admin') {
      authLogger.warn({
        userId: authRequest.user.userId,
        role: authRequest.user.role
      }, 'Admin access denied');
      
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
        timestamp: new Date().toISOString()
      });
    }
    
    authLogger.debug({
      userId: authRequest.user?.userId,
      role: authRequest.user?.role || 'admin'
    }, 'Admin access granted');
  } catch (error) {
    authLogger.error({ error }, 'Admin check error');
    return reply.status(500).send({
      success: false,
      error: 'Internal Server Error',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

// Role-based authorization middleware factory
// Requires additional data retrieval since we don't store role in request.user
export const requireRoles = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      // Type assertion and null check
      const authRequest = request as AuthRequest;
      if (!authRequest.user) {
        throw new Error('User not authenticated')
      }

      // If role is already in the token, use it
      if (authRequest.user.role) {
        if (!allowedRoles.includes(authRequest.user.role)) {
          authLogger.warn({
            userId: authRequest.user.userId,
            userRole: authRequest.user.role,
            requiredRoles: allowedRoles
          }, 'Insufficient permissions');
          
          reply.status(403).send({
            success: false,
            error: 'Forbidden',
            message: 'Insufficient permissions',
            timestamp: new Date().toISOString()
          });
          return;
        }
      } else {
        // Note: In a real implementation, you would need to retrieve the user's role
        // from a database or other source using the userId
        // This is just a placeholder - implement this part according to your application's logic
        const userRole = await getUserRoleById(authRequest.user.userId);
        
        // Check if user's role is allowed
        if (!allowedRoles.includes(userRole)) {
          authLogger.warn({
            userId: authRequest.user.userId,
            userRole,
            requiredRoles: allowedRoles
          }, 'Insufficient permissions')
          
          reply.status(403).send({
            success: false,
            error: 'Forbidden',
            message: 'Insufficient permissions',
            timestamp: new Date().toISOString()
          })
          return
        }
      }

      authLogger.debug({
        userId: authRequest.user.userId,
        role: authRequest.user.role
      }, 'Role authorization successful')
    } catch (error) {
      reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Authentication required',
        timestamp: new Date().toISOString()
      })
      return
    }
  }
}

// Mock function to get user role - replace with your implementation
async function getUserRoleById(userId: string): Promise<string> {
  // For testing purposes, return 'admin' to allow admin access
  authLogger.debug({ userId }, 'Mocked getUserRoleById returning admin role');
  return 'admin';
}

// Convenience middleware compositions
export const requireAdmin = requireRoles(['admin'])
export const requireStaff = requireRoles(['admin', 'staff'])
export const requireUser = requireRoles(['admin', 'staff', 'user'])

export default authMiddleware 