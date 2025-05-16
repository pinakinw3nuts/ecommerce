import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';
import { User } from '../entities';
import logger from '../utils/logger';

// Extend the Request interface
declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

// JWT secret should come from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create a factory function that returns Express middleware
export const authenticateJwt = (dataSource: DataSource) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      
      const decoded = request.user as { id: string };
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.id } });

      if (!user) {
        return reply.status(401).send({ message: 'User not found' });
      }

      request.currentUser = {
        id: user.id,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      logger.error(error, 'Authentication failed');
      return reply.status(401).send({ message: 'Authentication failed' });
    }
  };
}; 