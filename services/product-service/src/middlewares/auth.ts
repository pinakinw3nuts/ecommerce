import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  name: string;
  role: string;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ message: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return reply.code(401).send({ message: 'No token provided' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Add user info to request
    (request as any).user = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return reply.code(401).send({ message: 'Invalid token' });
    }
    return reply.code(500).send({ message: 'Internal server error' });
  }
} 