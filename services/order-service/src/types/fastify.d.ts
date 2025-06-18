import '@fastify/jwt';

// Extend the default JWT payload type to include both userId and id
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId?: string;
      id?: string;
      email?: string;
      role?: string;
      [key: string]: any; 
    };
    user: {
      userId?: string;
      id?: string;
      email?: string;
      role?: string;
      [key: string]: any;
    };
  }
} 