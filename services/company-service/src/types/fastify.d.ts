import { FastifyRequest as OriginalFastifyRequest } from 'fastify';

declare module 'fastify' {
  export interface FastifyRequest extends OriginalFastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      name?: string;
      [key: string]: any;
    };
  }
} 