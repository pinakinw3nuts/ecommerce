import { FastifyRequest, FastifyReply } from 'fastify';

export function roleGuard(requiredRole: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as unknown as { id: string; roles?: string[] };
      
      if (!user?.id || !user.roles?.includes(requiredRole)) {
        return reply.status(403).send({
          message: `Access denied. Required role: ${requiredRole}`
        });
      }
    } catch (error) {
      return reply.status(401).send({
        message: 'Authentication required'
      });
    }
  };
} 