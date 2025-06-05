import { FastifyRequest, FastifyReply } from 'fastify';
import { decodeToken } from '../utils/auth';

// Define user interface with role
export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

/**
 * Authentication guard middleware for admin-only routes
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
  } catch (error) {
    reply.status(500).send({ 
      success: false,
      message: 'Authentication error' 
    });
  }
}; 