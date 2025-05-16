import { FastifyInstance } from 'fastify';
import { SwaggerOptions } from '@fastify/swagger';

declare module 'fastify' {
  interface FastifyInstance {
    swagger: SwaggerOptions & {
      addSchema: (schema: object) => void;
    };
    addSchema: (schema: object) => void;
  }
} 