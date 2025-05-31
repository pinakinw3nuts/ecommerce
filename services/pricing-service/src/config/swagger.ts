import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { env } from './env';
import { version } from '../../package.json';

// Swagger configuration
export const swaggerConfig: FastifyDynamicSwaggerOptions = {
  mode: 'dynamic',
  openapi: {
    info: {
      title: 'Pricing Service API',
      description: 'API for managing product pricing, price lists, and currency conversion',
      version,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    externalDocs: {
      description: 'Find more info here',
      url: 'https://example.com/docs'
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      { name: 'pricing', description: 'Pricing related endpoints' },
      { name: 'rates', description: 'Currency rate related endpoints' },
      { name: 'admin', description: 'Admin only endpoints' },
      { name: 'public', description: 'Public endpoints' },
      { name: 'Health', description: 'Health check endpoints' }
    ]
  },
  stripBasePath: true,
  hideUntagged: false
};

// Swagger UI configuration
export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject) => {
    return swaggerObject;
  },
  transformSpecificationClone: true
}; 