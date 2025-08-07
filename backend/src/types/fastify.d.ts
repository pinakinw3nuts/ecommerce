import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  export interface FastifyInstance {
    jwt: {
      sign: (payload: any, options?: any) => string;
      verify: (token: string) => any;
    };
  }

  export interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: string;
      name: string;
    };
  }
}