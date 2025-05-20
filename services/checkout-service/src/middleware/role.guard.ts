import { FastifyRequest, FastifyReply } from 'fastify';
import { UserPayload } from '../types/auth';

export function roleGuard(requiredRole: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserPayload | undefined;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (user.role !== requiredRole) {
        throw new Error(`Requires ${requiredRole} role`);
      }
    } catch (error) {
      reply.code(403).send({
        success: false,
        error: 'Forbidden',
        message: error instanceof Error ? error.message : 'Insufficient permissions'
      });
    }
  };
} 