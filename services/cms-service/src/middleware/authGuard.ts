import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { verify } from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * JWT user interface
 */
export interface JwtUser {
  id: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

/**
 * Authentication middleware for Fastify
 * Verifies JWT token and attaches user to request
 */
export function authGuard(req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      reply.code(401).send({ message: 'No authorization header provided' });
      return done(new Error('No authorization header provided'));
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      reply.code(401).send({ message: 'No token provided' });
      return done(new Error('No token provided'));
    }

    try {
      const decoded = verify(token, config.jwtSecret) as JwtUser;
      (req as any).user = decoded;
      done();
    } catch (error) {
      logger.error('Token verification failed', { error });
      reply.code(401).send({ message: 'Invalid token' });
      return done(new Error('Invalid token'));
    }
  } catch (error) {
    logger.error('Auth middleware error', { error });
    reply.code(500).send({ message: 'Internal server error' });
    return done(error instanceof Error ? error : new Error('Internal server error'));
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
    const user = (req as any).user;
    
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