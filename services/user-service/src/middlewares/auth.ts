import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../entities';
import { decodeToken, TokenPayload } from '../utils/jwt';
import logger from '../utils/logger';

// Define the current user type to ensure consistency
export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
}

// Extend the Request interface to include the validated token payload
declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: CurrentUser;
  }
}

/**
 * Creates an authentication middleware that validates JWT tokens
 * and attaches the current user to the request
 */
export const createAuthMiddleware = (dataSource: DataSource) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      
      if (!authHeader) {
        return reply.status(401).send({ message: 'Authentication token is required' });
      }

      const token = authHeader.split(' ')[1];
      
      if (!token) {
        return reply.status(401).send({ message: 'Invalid authentication format' });
      }

      // Decode and validate the token
      const decoded = decodeToken(token);

      // Verify user exists in database
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.userId } });

      if (!user) {
        logger.warn({ userId: decoded.userId }, 'User from token not found in database');
        return reply.status(401).send({ message: 'User not found' });
      }

      // Attach validated user to request
      request.currentUser = {
        id: user.id,
        email: user.email,
        role: user.role
      };

    } catch (error) {
      logger.error({ error }, 'Authentication failed');
      
      if (error instanceof Error) {
        return reply.status(401).send({ message: error.message });
      }
      
      return reply.status(401).send({ message: 'Authentication failed' });
    }
  };
}; 