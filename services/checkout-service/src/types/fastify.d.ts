import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      role: string;
      [key: string]: any;
    };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      role: string;
      [key: string]: any;
    };
  }
} 