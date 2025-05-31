import fastifyJwt from '@fastify/jwt';
import { FastifyRequest } from 'fastify';

// Define a common user interface
export interface User {
  id: string;
  roles?: string[];
  name?: string;
}

// Extend FastifyJWT to use our custom User type
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: User;
  }
}

// Extend Fastify request to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user: User;
  }
} 