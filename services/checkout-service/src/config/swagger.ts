import { SwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { config } from './env';
import { CouponType } from '../entities/Coupon';

const version = '1.0.0';

export const swaggerConfig: SwaggerOptions = {
  openapi: {
    info: {
      title: 'Checkout Service API',
      description: 'Checkout service API documentation',
      version,
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}/api/v1`
      }
    ],
    tags: [
      { name: 'checkout', description: 'Checkout related end-points' },
      { name: 'coupons', description: 'Coupon related end-points' },
      { name: 'shipping', description: 'Shipping related end-points' },
      { name: 'health', description: 'Health check end-points' }
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
        Coupon: {
          type: 'object',
          required: ['id', 'code', 'type', 'value', 'isActive'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', minLength: 3, maxLength: 50 },
            type: { type: 'string', enum: [CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT] },
            value: { type: 'number', minimum: 0 },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            maxUses: { type: 'integer', minimum: 1, nullable: true },
            minimumPurchaseAmount: { type: 'number', minimum: 0, nullable: true },
            applicableProducts: {
              type: 'array',
              items: { type: 'string' },
              nullable: true
            },
            isActive: { type: 'boolean' },
            usageCount: { type: 'integer', minimum: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
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
              enum: ['PENDING', 'COMPLETED', 'EXPIRED', 'FAILED']
            },
            totals: {
              type: 'object',
              properties: {
                subtotal: { type: 'number' },
                tax: { type: 'number' },
                shippingCost: { type: 'number' },
                discount: { type: 'number' },
                total: { type: 'number' }
              }
            },
            shippingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' }
              }
            },
            billingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' }
              }
            },
            discountCode: { type: 'string' },
            paymentIntentId: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true
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