import { FastifyRequest, FastifyReply } from 'fastify';
import { decodeToken, JwtPayload } from '../utils/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export const authGuard = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    reply.code(401).send({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  const decoded = decodeToken(token);
  if (!decoded) {
    reply.code(401).send({ error: 'Invalid token' });
    return;
  }

  request.user = decoded;
}; 