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

// In services/cart-service/src/middleware/auth.ts
export const attachUserIfPresent = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  const authHeader = request.headers.authorization;
  console.log('Auth header:', authHeader);
  if (!authHeader) return;
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;
  console.log('Token:', token);
  const decoded = decodeToken(token);
  console.log('Decoded token:', decoded);
  if (decoded) {
    request.user = decoded;
    console.log('User attached to request:', request.user);
  }
};