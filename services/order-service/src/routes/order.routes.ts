import { FastifyInstance } from 'fastify';
import { roleGuard } from '../middleware/roleGuard';
import { Order, OrderStatus } from '../entities/Order';

const orderResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    totalAmount: { type: 'number' },
    status: { type: 'string', enum: Object.values(OrderStatus) },
    shippingAddress: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
        postalCode: { type: 'string' }
      }
    },
    billingAddress: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
        postalCode: { type: 'string' }
      }
    },
    trackingNumber: { type: 'string', nullable: true },
    metadata: { type: 'object', additionalProperties: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'number' },
          price: { type: 'number' }
        }
      }
    },
    taxAmount: { type: 'number' },
    shippingAmount: { type: 'number' },
    discountAmount: { type: 'number' }
  }
};

const createOrderSchema = {
  type: 'object',
  required: ['userId', 'items', 'shippingAddress'],
  properties: {
    userId: { type: 'string', format: 'uuid' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'number', minimum: 1 }
        }
      }
    },
    shippingAddress: {
      type: 'object',
      required: ['street', 'city', 'state', 'country', 'postalCode'],
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
        postalCode: { type: 'string' }
      }
    },
    billingAddress: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
        postalCode: { type: 'string' }
      }
    }
  }
};

export async function orderRoutes(fastify: FastifyInstance) {
  // Authenticate all routes in this plugin
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ message: 'Unauthorized' });
    }
  });

  // Get all orders (admin only)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Get all orders',
        description: 'Retrieve a list of all orders. Admin access required.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: orderResponseSchema
          },
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: roleGuard('admin')
    },
    async (request, reply) => {
      // TODO: Implement order listing
      return reply.send([]);
    }
  );

  // Get order by ID
  fastify.get<{
    Params: { orderId: string };
  }>(
    '/:orderId',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Get order by ID',
        description: 'Retrieve a specific order by its ID.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['orderId'],
          properties: {
            orderId: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: orderResponseSchema,
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      // TODO: Implement get order by ID
      return reply.send({});
    }
  );

  // Create order
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Create a new order',
        description: 'Create a new order with the provided details.',
        security: [{ bearerAuth: [] }],
        body: createOrderSchema,
        response: {
          201: orderResponseSchema,
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      // TODO: Implement order creation
      return reply.status(201).send({});
    }
  );

  // Update order (admin only)
  fastify.put<{
    Params: { orderId: string };
  }>(
    '/:orderId',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Update an order',
        description: 'Update an existing order. Admin access required.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['orderId'],
          properties: {
            orderId: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: Object.values(OrderStatus) },
            trackingNumber: { type: 'string' },
            metadata: { type: 'object', additionalProperties: true }
          }
        },
        response: {
          200: orderResponseSchema,
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: roleGuard('admin')
    },
    async (request, reply) => {
      // TODO: Implement order update
      return reply.send({});
    }
  );
} 