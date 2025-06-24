import { FastifyRequest, FastifyReply } from 'fastify';

export function roleGuard(requiredRole: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as unknown as { id: string; roles?: string[]; role?: string };
      
      // Check for admin role header from the admin panel
      const adminRoleHeader = request.headers['x-admin-role'];
      if (adminRoleHeader === 'admin' && requiredRole === 'admin') {
        // Allow access if the special admin header is present
        return;
      }
      
      // Check user roles array
      if (user?.roles?.includes(requiredRole)) {
        return;
      }
      
      // Check user role string (backward compatibility)
      if (user?.role === requiredRole) {
        return;
      }
      
      // If we get here, access is denied
      if (!user?.id) {
        return reply.status(401).send({
          message: 'Authentication required'
        });
      }
      
      return reply.status(403).send({
        message: `Access denied. Required role: ${requiredRole}`
      });
    } catch (error) {
      return reply.status(401).send({
        message: 'Authentication required'
      });
    }
  };
} 