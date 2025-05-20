import { FastifyRequest } from 'fastify';
import * as jwt from 'jsonwebtoken';
import { UserPayload } from '../types/auth';

export async function adminGuard(request: FastifyRequest): Promise<void> {
  const token = extractTokenFromHeader(request);

  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as UserPayload;

    // Check if user has admin role
    if (payload.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Attach user to request for further use
    request.user = payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

function extractTokenFromHeader(request: FastifyRequest): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
} 