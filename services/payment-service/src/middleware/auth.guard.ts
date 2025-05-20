import { FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '../utils/logger'
import { config } from '../config/env'
import jwt from 'jsonwebtoken'

const authLogger = logger.child({ module: 'AuthGuard' })

// JWT payload interface to match what we get from the token
interface JwtPayload {
  id: string
  email: string
  role: string
  iat: number
  exp: number
}

// Create a custom interface for authenticated requests
export interface AuthRequest extends FastifyRequest {
  user: {
    userId: string
  }
}

export const authGuard = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'No authorization header',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      // Type assertion to AuthRequest to set the user property
      (request as AuthRequest).user = { userId: decoded.id };
      authLogger.debug({ userId: decoded.id }, 'User authenticated successfully')
    } catch (error) {
      authLogger.error({ error }, 'Authentication failed')
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    authLogger.error({ error }, 'Auth guard error');
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

      authLogger.debug({
        userId: authRequest.user.userId,
        role: userRole
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
async function getUserRoleById(_: string): Promise<string> {
  // Implement this function to fetch the user's role from your database
  return 'user'; // Default role
}

// Convenience middleware compositions
export const requireAdmin = requireRoles(['admin'])
export const requireStaff = requireRoles(['admin', 'staff'])
export const requireUser = requireRoles(['admin', 'staff', 'user'])

export default authGuard 