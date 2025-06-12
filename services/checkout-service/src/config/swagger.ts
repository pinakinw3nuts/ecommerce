import { SwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { config } from './env';
import { CheckoutStatus } from '../entities/CheckoutSession';

const version = '1.0.0';

export const swaggerConfig: SwaggerOptions = {
  openapi: {
    info: {
      title: 'Checkout Service API',
      description: 'Checkout service API documentation for e-commerce platform',
      version,
      contact: {
        name: 'API Support',
        email: 'support@ecommerce.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}/api/v1`,
        description: 'Development server'
      },
      {
        url: 'https://api.ecommerce.com/checkout/api/v1',
        description: 'Production server'
      }
    ],
    tags: [
      { name: 'checkout', description: 'Checkout related end-points' },
      { name: 'shipping', description: 'Shipping options and delivery estimation' },
      { name: 'health', description: 'Health check and system status' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        CartItem: {
          type: 'object',
          required: ['productId', 'quantity', 'price'],
          properties: {
            productId: { type: 'string', format: 'uuid' },
            quantity: { type: 'number', minimum: 1 },
            price: { type: 'number', minimum: 0 },
            name: { type: 'string' },
            metadata: {
              type: 'object',
              additionalProperties: true
            }
          }
        },
        Address: {
          type: 'object',
          required: ['street', 'city', 'state', 'zipCode', 'country'],
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zipCode: { type: 'string' },
            country: { type: 'string', minLength: 2, maxLength: 2 }
          }
        },
        PriceTotals: {
          type: 'object',
          required: ['subtotal', 'tax', 'shippingCost', 'discount', 'total'],
          properties: {
            subtotal: { type: 'number' },
            tax: { type: 'number' },
            shippingCost: { type: 'number' },
            discount: { type: 'number' },
            total: { type: 'number' }
          }
        },
        ShippingOption: {
          type: 'object',
          required: ['method', 'carrier', 'cost', 'estimatedDays'],
          properties: {
            method: { 
              type: 'string',
              enum: ['STANDARD', 'EXPRESS', 'OVERNIGHT', 'INTERNATIONAL']
            },
            carrier: { type: 'string' },
            cost: { type: 'number' },
            estimatedDays: { type: 'string' },
            estimatedDelivery: {
              type: 'object',
              properties: {
                earliest: { type: 'string', format: 'date-time' },
                latest: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        CheckoutSession: {
          type: 'object',
          required: ['id', 'userId', 'status'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            cartSnapshot: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' }
            },
            status: {
              type: 'string',
              enum: Object.values(CheckoutStatus)
            },
            totals: { $ref: '#/components/schemas/PriceTotals' },
            shippingAddress: { $ref: '#/components/schemas/Address' },
            billingAddress: { $ref: '#/components/schemas/Address' },
            discountCode: { type: 'string' },
            paymentIntentId: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
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