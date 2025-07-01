import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { config } from './env';

export const swaggerConfig = {
  mode: 'dynamic' as const,
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
          type: 'http' as const,
          scheme: 'bearer' as const,
          bearerFormat: 'JWT',
          description: 'Enter the token with the `Bearer: ` prefix, e.g. "Bearer abcde12345".'
        }
      }
    },
    tags: [
      { name: 'payments', description: 'Customer payment related endpoints' },
      { name: 'payment-methods', description: 'Customer payment method endpoints' },
      { name: 'payment-gateways', description: 'Payment gateway management endpoints' },
      { name: 'webhooks', description: 'External service webhook endpoints' },
      { name: 'admin', description: 'General admin endpoints' },
      { name: 'admin-payments', description: 'Admin payment management' },
      { name: 'admin-payment-methods', description: 'Admin payment method management' },
      { name: 'health', description: 'Health check endpoints' }
    ],
    security: [
      { bearerAuth: [] }
    ]
  }
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    persistAuthorization: true
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