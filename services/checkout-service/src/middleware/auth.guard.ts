import { FastifyRequest, FastifyReply } from 'fastify';
import * as jwt from 'jsonwebtoken';
import { UserPayload } from '../types/auth';

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new Error('Invalid authorization header');
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as UserPayload;

    // Attach user to request
    request.user = payload;
  } catch (error: any) {
    reply.code(401).send({
      success: false,
      error: 'Unauthorized',
      message: error.message || 'Invalid or expired token'
    });
  }
} 