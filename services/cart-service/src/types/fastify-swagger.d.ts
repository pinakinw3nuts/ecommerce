declare module 'fastify-swagger' {
  import { FastifyPluginCallback } from 'fastify';

  interface SwaggerOptions {
    routePrefix?: string;
    swagger: {
      info: {
        title: string;
        description?: string;
        version: string;
      };
      host?: string;
      schemes?: string[];
      consumes?: string[];
      produces?: string[];
      tags?: { name: string; description?: string }[];
      securityDefinitions?: Record<string, any>;
    };
    exposeRoute?: boolean;
    hiddenTag?: string;
  }

  const fastifySwagger: FastifyPluginCallback<SwaggerOptions>;
  export default fastifySwagger;
} 