import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { verify } from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Interface representing the decoded JWT user data
 */
export interface JwtUser {
  id: string;
  email: string;
  roles: string[];
  name?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Authentication middleware for Fastify
 * Verifies JWT token from Authorization header
 */
export function authGuard(req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('Authentication failed: No authorization header');
      reply.status(401).send({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
      return;
    }
    
    // Extract token from header (Bearer <token>)
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('Authentication failed: Empty token');
      reply.status(401).send({
        success: false,
        message: 'Authentication token required',
        error: 'UNAUTHORIZED'
      });
      return;
    }
    
    try {
      const decoded = verify(token, env.JWT_SECRET) as JwtUser;
      (req as any).user = decoded;
      done();
    } catch (error) {
      logger.warn('Authentication failed: Invalid token', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      reply.status(401).send({
        success: false,
        message: 'Invalid or expired authentication token',
        error: 'UNAUTHORIZED'
      });
    }
  } catch (error) {
    logger.error('Error in authentication middleware', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    reply.status(500).send({
      success: false,
      message: 'Internal server error during authentication',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required roles
 * 
 * @param requiredRoles - Array of roles required to access the route
 * @returns Middleware function that checks user roles
 * 
 * @example
 * ```ts
 * // Require admin role
 * router.get('/admin-only', authGuard, requireRoles(['admin']), (req, res) => {
 *   res.send('Admin only content');
 * });
 * 
 * // Require either editor or admin role
 * router.get('/editors', authGuard, requireRoles(['editor', 'admin']), (req, res) => {
 *   res.send('Editor content');
 * });
 * ```
 */
export function requireRoles(requiredRoles: string[]) {
  return (req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction): void => {
    const contextLogger = logger.child({ context: 'requireRoles' });
    const user = (req as any).user as JwtUser;
    
    if (!user) {
      reply.code(401).send({ message: 'Authentication required' });
      return done(new Error('Authentication required'));
    }
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => 
      user.roles && user.roles.includes(role)
    );
    
    if (!hasRequiredRole) {
      contextLogger.warn('Insufficient permissions', { 
        userId: user.id, 
        userRoles: user.roles,
        requiredRoles 
      });
      
      reply.code(403).send({
        message: 'Insufficient permissions',
        error: 'FORBIDDEN'
      });
      return done(new Error('Insufficient permissions'));
    }
    
    done();
  };
} 