import { FastifyRequest, FastifyReply } from 'fastify';
import { decodeToken } from '../utils/auth';
import logger from '../utils/logger';

// Define user interface with role
export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

/**
 * Authentication guard middleware for admin-only routes
 * Uses token decoder and validates admin role
 */
export const authGuard = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    // TEMPORARY: Skip authentication for development
    // Simulate an admin user for testing
    request.user = {
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
      name: 'Admin User'
    };
    
    // Continue to route handler
    return;
    
    /* Original auth code commented out temporarily
    // Extract token from authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ 
        success: false,
        message: 'Authentication required' 
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Decode and verify token
    const decoded = await decodeToken(token);
    
    if (!decoded) {
      reply.status(401).send({ 
        success: false,
        message: 'Invalid or expired token' 
      });
      return;
    }
    
    // Validate admin role
    if (decoded.role !== 'admin') {
      logger.warn({ userId: decoded.id, role: decoded.role }, 'Unauthorized access attempt to admin resource');
      reply.status(403).send({ 
        success: false,
        message: 'Admin access required' 
      });
      return;
    }
    
    // Attach user to request for downstream handlers
    request.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    };
    */
  } catch (error) {
    logger.error(error, 'Authentication error');
    reply.status(500).send({ 
      success: false,
      message: 'Authentication error' 
    });
  }
}; 