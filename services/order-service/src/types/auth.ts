import '@fastify/jwt';

export interface CustomJWTPayload {
  id: string;
  email?: string;
  roles?: string[];
  role?: string;
  iat?: number;
  exp?: number;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: CustomJWTPayload
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: CustomJWTPayload
  }
} 