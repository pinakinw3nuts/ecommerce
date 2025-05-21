import 'fastify'
import { User } from '../middlewares/authGuard';
import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    diContainer: {
      resolve(name: string): any;
      register(name: string, instance: any): void;
    }
  }

  interface FastifyRequest {
    user?: User;
  }
}