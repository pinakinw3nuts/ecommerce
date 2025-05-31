import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { CompanyRole } from '../constants/roles';

// Define JWT payload interface
export interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
  companyId?: string;
  companyRole?: CompanyRole;
  // Standard JWT fields
  iat?: number;  // Issued at timestamp
  exp?: number;  // Expiration timestamp
  iss?: string;  // Issuer
  aud?: string;  // Audience
}

// Define request user interface to be attached to request
export interface RequestUser {
  id: string;
  email?: string;
  role?: string;
  companyId?: string;
  companyRole?: CompanyRole;
}

// We don't need to extend the FastifyRequest interface here
// as it's already defined by @fastify/jwt

/**
 * Middleware to authenticate requests using JWT
 * Verifies the token and attaches the user to the request
 */
export async function authGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Verify the JWT token
    await request.jwtVerify();
    
    // Map the JWT payload to our RequestUser type
    const jwtUser = request.user as any;
    
    // Create a new user object with our expected structure
    const user: RequestUser = {
      id: jwtUser.userId,
      email: jwtUser.email,
      role: jwtUser.role,
      companyId: jwtUser.companyId,
      companyRole: jwtUser.companyRole
    };
    
    // Replace the user object
    (request as any).user = user;
    
    // If we reach here, the token is valid and user is attached to request
    logger.debug({
      requestId: request.id,
      userId: user.id,
      email: user.email
    }, 'User authenticated');

  } catch (err) {
    logger.debug({
      err,
      requestId: request.id,
      path: request.url
    }, 'Authentication failed');
    
    // Return unauthorized response
    reply.status(401).send({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
  }
}

/**
 * Middleware to get user from token but not require authentication
 * This is useful for routes that can work with or without authentication
 */
export async function optionalAuth(request: FastifyRequest): Promise<void> {
  try {
    // Try to verify the JWT token, but don't throw if missing
    await request.jwtVerify();
    
    // Map the JWT payload to our RequestUser type if verification succeeded
    const jwtUser = request.user as any;
    
    // Create a new user object with our expected structure
    const user: RequestUser = {
      id: jwtUser.userId,
      email: jwtUser.email,
      role: jwtUser.role,
      companyId: jwtUser.companyId,
      companyRole: jwtUser.companyRole
    };
    
    // Replace the user object
    (request as any).user = user;
  } catch (err) {
    // Just log at trace level and continue
    logger.trace({
      requestId: request.id,
      path: request.url
    }, 'Optional auth: No valid authentication');
  }
}

/**
 * Role-based authorization middleware factory
 * Creates a middleware that checks if the user has the required role
 */
export function roleGuard(requiredRole: CompanyRole) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // First ensure user is authenticated
    if (!request.user) {
      logger.warn('Unauthenticated access attempt to protected route');
      return reply.code(401).send({ 
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED' 
      });
    }

    // Cast to our RequestUser type
    const user = request.user as any as RequestUser;
    
    // Then check if user has required company role
    const userRole = user.companyRole;
    
    if (!userRole) {
      logger.warn({ 
        userId: user.id,
        requiredRole
      }, 'User has no company role');
      
      return reply.code(403).send({ 
        success: false,
        message: 'No company role assigned',
        code: 'ROLE_MISSING' 
      });
    }

    // Hierarchy check based on role levels
    const roleHierarchy: Record<CompanyRole, number> = {
      'OWNER': 50,
      'ADMIN': 40,
      'FINANCE': 30,
      'APPROVER': 20,
      'BUYER': 10,
      'VIEWER': 0
    };

    // Make sure we have valid roles before comparing
    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      logger.warn({ 
        userId: user.id,
        userRole,
        requiredRole
      }, 'Insufficient permissions');
      
      return reply.code(403).send({ 
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN' 
      });
    }
    
    // User has sufficient permissions, proceed
    logger.debug({ 
      userId: user.id,
      userRole,
      requiredRole
    }, 'Authorization successful');
  };
} 