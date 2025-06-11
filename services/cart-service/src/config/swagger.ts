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
      description: 'Cart service API documentation for the e-commerce system',
      version,
      contact: {
        name: 'E-commerce Team',
        url: 'https://github.com/your-org/ecommerce'
      }
    },
    servers: [
      {
        url: `http://${HOST}:${PORT}/api/v1`,
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'cart', description: 'Cart related endpoints' },
      { name: 'system', description: 'System health and monitoring endpoints' }
    ],
    components: {
      schemas: {
        CartItem: {
          type: 'object',
          required: ['id', 'productId', 'quantity'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the cart item' },
            productId: { type: 'string', format: 'uuid', description: 'ID of the product' },
            variantId: { type: 'string', format: 'uuid', nullable: true, description: 'ID of the product variant (if applicable)' },
            quantity: { type: 'integer', minimum: 1, description: 'Quantity of the item' },
            price: { type: 'number', format: 'float', description: 'Current price of the item' },
            productSnapshot: {
              type: 'object',
              description: 'Snapshot of product data at the time it was added to the cart',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                imageUrl: { type: 'string' },
                variantName: { type: 'string' },
                metadata: { type: 'object', additionalProperties: true }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Cart: {
          type: 'object',
          required: ['id', 'items'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the cart' },
            userId: { type: 'string', format: 'uuid', nullable: true, description: 'ID of the user who owns this cart (null for guest carts)' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' },
              description: 'Items in the cart'
            },
            total: { type: 'number', format: 'float', description: 'Total price of all items in the cart' },
            itemCount: { type: 'integer', description: 'Total number of items in the cart' },
            isCheckedOut: { type: 'boolean', description: 'Whether the cart has been checked out' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: { type: 'string', description: 'Error type or code' },
            message: { type: 'string', description: 'Human-readable error message' },
            details: { 
              type: 'array', 
              items: { type: 'object', additionalProperties: true },
              description: 'Additional error details'
            }
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
    deepLinking: false,
    displayRequestDuration: true,
    filter: true
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