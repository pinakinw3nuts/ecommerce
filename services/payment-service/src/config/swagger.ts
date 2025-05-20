import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { config } from './env';

export const swaggerConfig = {
  mode: 'dynamic',
  openapi: {
    info: {
      title: 'Payment Service API',
      description: 'Payment processing service API documentation',
      version: '1.0.0'
    },
    servers: [{
      url: `http://localhost:${config.server.port}`
    }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter the token with the `Bearer: ` prefix, e.g. "Bearer abcde12345".'
        }
      }
    }
  }
} as const;

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  },
  uiHooks: {
    onRequest: function (_request, _reply, next) {
      next();
    },
    preHandler: function (_request, _reply, next) {
      next();
    }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
}; 