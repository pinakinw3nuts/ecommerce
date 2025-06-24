import { FastifyInstance } from 'fastify';
import { roleGuard } from '../middleware/roleGuard';
import { Order, OrderStatus } from '../entities/Order';
import { OrderController } from '../controllers/order.controller';
import { orderCheckoutRoutes } from './orders-checkout.routes';

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

// Export separate routes for authenticated and public endpoints
export async function orderRoutes(fastify: FastifyInstance) {
  const orderController = new OrderController();

  // Register public checkout routes first (no authentication required)
  await fastify.register(async (publicInstance: FastifyInstance) => {
    await publicInstance.register(orderCheckoutRoutes, { 
      prefix: '/checkout', 
      orderService: orderController.orderService 
    });
  });

  // Authenticated routes with JWT verification
  await fastify.register(async (authInstance: FastifyInstance) => {
    // Authenticate all routes in this plugin except those already registered
    authInstance.addHook('onRequest', async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ message: 'Unauthorized' });
      }
    });

    // Get all orders (admin only)
    authInstance.get(
      '/',
      {
        schema: {
          tags: ['Orders'],
          summary: 'Get all orders',
          description: 'Retrieve a list of all orders. Admin access required.',
          security: [{ bearerAuth: [] }],
          querystring: {
            type: 'object',
            properties: {
              page: { type: 'number', default: 1 },
              limit: { type: 'number', default: 10 },
              status: { type: 'string', enum: Object.values(OrderStatus) },
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
              sortBy: { type: 'string' },
              order: { type: 'string', enum: ['ASC', 'DESC'] }
            }
          },
          response: {
            200: {
              type: 'object',
              properties: {
                orders: {
                  type: 'array',
                  items: orderResponseSchema
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    pages: { type: 'number' },
                    page: { type: 'number' },
                    limit: { type: 'number' }
                  }
                }
              }
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
        try {
          const { 
            page = 1, 
            limit = 10, 
            status, 
            startDate, 
            endDate, 
            minAmount, 
            maxAmount,
            sortBy = 'createdAt',
            order = 'DESC'
          } = request.query as any;

          const filters: any = {
            status: status,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            minAmount: minAmount ? Number(minAmount) : undefined,
            maxAmount: maxAmount ? Number(maxAmount) : undefined,
          };

          const pagination = {
            page: Number(page),
            limit: Number(limit),
            sortBy,
            order
          };

          const [orders, total] = await orderController.orderService.getOrders(
            filters,
            pagination
          );

          return reply.send({
            orders: orders,
            pagination: {
              total,
              page: pagination.page,
              limit: pagination.limit,
              pages: Math.ceil(total / pagination.limit)
            }
          });
        } catch (error) {
          request.log.error('Error fetching orders:', error);
          return reply.status(500).send({ message: 'Failed to fetch orders' });
        }
      }
    );

    // Get order by ID
    authInstance.get<{
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
        try {
          const { orderId } = request.params;
          const { id: userId, roles } = request.user as { id: string, roles?: string[] };
          
          if (!userId) {
            return reply.status(401).send({ message: 'Unauthorized' });
          }
          
          const order = await orderController.orderService.getOrderById(orderId);
          
          if (!order) {
            return reply.status(404).send({ message: 'Order not found' });
          }
          
          // Allow admins to see any order, but regular users can only see their own orders
          const isAdmin = roles?.includes('admin');
          if (!isAdmin && order.userId !== userId) {
            return reply.status(403).send({ message: 'You do not have permission to view this order' });
          }
          
          return reply.send(order);
        } catch (error) {
          request.log.error(`Error fetching order ${request.params.orderId}:`, error);
          return reply.status(500).send({ message: 'Failed to fetch order details' });
        }
      }
    );

    // Create order
    authInstance.post(
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
        await orderController.createOrder(request as any, reply); // Cast to any for now to avoid complex FastifyRequest typing issues
      }
    );

    // Update order (admin only)
    authInstance.put<{
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
        // TODO: Implement update order
        return reply.send({});
      }
    );

    // Cancel order
    authInstance.post<{
      Params: { orderId: string };
    }>(
      '/:orderId/cancel',
      {
        schema: {
          tags: ['Orders'],
          summary: 'Cancel an order',
          description: 'Cancel an existing order.',
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
            required: ['reason'],
            properties: {
              reason: { type: 'string' }
            }
          },
          response: {
            200: orderResponseSchema,
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
        try {
          const { orderId } = request.params;
          const body = request.body as any;
          const reason = body.reason || '';
          const bodyUserId = body.userId;
          const createdBy = body.createdBy;
          const userObj = body.user;
          
          // First try to get user from JWT
          const userFromJwt = request.user as { id?: string, roles?: string[] } || {};
          
          // Extract user ID from multiple possible sources with priority
          const userId = userFromJwt.id || bodyUserId || createdBy || userObj?.id;

          if (!userId) {
            fastify.log.debug('Request body:', body);
            fastify.log.debug('User from JWT:', userFromJwt);
            return reply.status(401).send({ message: 'Unauthorized - User ID not found' });
          }

          const order = await orderController.orderService.getOrderById(orderId);
          
          if (!order) {
            return reply.status(404).send({ message: 'Order not found' });
          }

          // Check if user has permission to cancel this order
          // Only verify user matching if the ID comes from JWT
          const roles = userFromJwt.roles || [];
          if (userFromJwt.id && order.userId !== userFromJwt.id && !roles.includes('admin')) {
            return reply.status(403).send({ message: 'You do not have permission to cancel this order' });
          }

          const cancelledOrder = await orderController.orderService.cancelOrder(orderId, userId, reason);
          return reply.send(cancelledOrder);
        } catch (error) {
          fastify.log.error(`Failed to cancel order ${request.params.orderId}:`, error);
          if (error instanceof Error && error.message.includes('cannot be cancelled')) {
            return reply.status(400).send({ message: error.message });
          }
          return reply.status(500).send({ message: 'Failed to cancel order' });
        }
      }
    );
  });
} 