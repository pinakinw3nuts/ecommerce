import { FastifyRequest, FastifyReply } from 'fastify';

export function roleGuard(requiredRole: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role?: string } | undefined;

    if (!user || user.role !== requiredRole) {
      reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }
  };
} 