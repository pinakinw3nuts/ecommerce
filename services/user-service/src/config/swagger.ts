import { SwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

const version = '1.0.0';

export const swaggerOptions: SwaggerOptions = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      description: 'User service API documentation',
      version,
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'user', description: 'User related end-points' },
      { name: 'address', description: 'Address related end-points' },
      { name: 'health', description: 'Health check end-points' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
}; 