import { SwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

const version = '1.0.0';

// Get host and port from environment variables with defaults
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || '3004';

export const swaggerConfig: SwaggerOptions = {
  openapi: {
    info: {
      title: 'Cart Service API',
      description: 'Cart service API documentation',
      version,
    },
    servers: [
      {
        url: `http://${HOST}:${PORT}/api/v1`
      }
    ],
    tags: [
      { name: 'cart', description: 'Cart related end-points' }
    ],
    components: {
      schemas: {
        CartItem: {
          type: 'object',
          required: ['id', 'productId', 'quantity'],
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            quantity: { type: 'number' },
            price: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Cart: {
          type: 'object',
          required: ['id', 'userId', 'items'],
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' }
            },
            total: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      },
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