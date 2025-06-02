import { FastifyRequest, FastifyReply } from 'fastify';

// Define a user type that's compatible with JWT payload
export interface JwtUser {
  id: string;
  email: string;
  roles?: string[];
  [key: string]: unknown;
}

// Extend FastifyRequest interface
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  
  interface FastifyRequest {
    user?: JwtUser;
  }
} 