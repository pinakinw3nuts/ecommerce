import { FastifyInstance } from 'fastify';
import { OrderController } from '../controllers/order.controller';
import { OrderStatus } from '../entities/Order';
import { OrderService } from '../services/order.service';
import { logger } from '../utils/logger';

// Helper function to ensure values are valid numbers
function ensureValidNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  // If it's already a number, return it
  if (typeof value === 'number') {
    return value;
  }
  
  // If it's a string that might have formatting issues
  if (typeof value === 'string') {
    // Remove all commas and ensure only one decimal point
    const cleaned = value.replace(/,/g, '').replace(/\.(?=.*\.)/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

/**
 * Public API endpoints for orders that can be accessed by the storefront app
 */
export async function publicOrderRoutes(fastify: FastifyInstance) {
  // Initialize controllers with services
  const orderService = new OrderService();
  const orderController = new OrderController(orderService);

  // Get orders for authenticated user
  fastify.get('/', {
    schema: {
      tags: ['Public Orders'],
      summary: 'Get orders for authenticated user',
      description: 'Get all orders for the currently authenticated user with pagination and sorting.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1, minimum: 1 },
          limit: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
          sort: { type: 'string', enum: ['createdAt', 'totalAmount', 'status'], default: 'createdAt' },
          order: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
          status: { type: 'string', enum: Object.values(OrderStatus) }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  orderNumber: { type: 'string' },
                  status: { type: 'string' },
                  paymentStatus: { type: 'string' },
                  paymentMethod: { type: 'string', nullable: true },
                  totalAmount: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
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
                  trackingNumber: { type: 'string', nullable: true },
                  shippingCarrier: { type: 'string', nullable: true },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        productId: { type: 'string' },
                        name: { type: 'string' },
                        price: { type: 'number' },
                        quantity: { type: 'number' },
                        image: { type: 'string', nullable: true },
                        sku: { type: 'string', nullable: true }
                      }
                    }
                  },
                  subtotal: { type: 'number' },
                  shippingCost: { type: 'number' },
                  tax: { type: 'number' },
                  discount: { type: 'number' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
                currentPage: { type: 'integer' },
                pageSize: { type: 'integer' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ message: 'Unauthorized - Invalid or expired token' });
      }
    }
  }, async (request, reply) => {
    try {
      const { user } = request as any;
      // Check for userId directly in token payload
      const userId = user?.userId || user?.id;
      
      if (!userId) {
        // Log token content for debugging
        logger.debug('Token content:', user);
        return reply.status(401).send({ message: 'Unauthorized - User ID not found in token' });
      }

      const { page = 1, limit = 10, sort = 'createdAt', order = 'DESC', status } = request.query as any;
      
      // Set up pagination and filters
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sort,
        order: order.toUpperCase() as 'ASC' | 'DESC'
      };
      
      const filters: any = {};
      if (status) {
        filters.status = status;
      }

      // Get orders for the specific user from the JWT
      const [orders, total] = await orderController.orderService.getOrdersByUserId(
        userId,
        filters,
        pagination
      );

      // Map the orders to a format suitable for the frontend
      const mappedOrders = orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber || `ORD-${order.id.substring(0, 8)}`,
        status: order.status,
        paymentStatus: order.paymentStatus || 'PENDING',
        paymentMethod: order.paymentMethod || 'N/A',
        totalAmount: ensureValidNumber(order.totalAmount),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
        shippingCarrier: order.shippingCarrier || 'N/A',
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.getName(),
          price: ensureValidNumber(item.price),
          quantity: item.quantity,
          image: item.getImage(),
          sku: item.getSku()
        })),
        subtotal: ensureValidNumber(order.subtotal || order.totalAmount - (ensureValidNumber(order.taxAmount) || 0) - (ensureValidNumber(order.shippingAmount) || 0) + (ensureValidNumber(order.discountAmount) || 0)),
        shippingCost: ensureValidNumber(order.shippingAmount) || 0,
        tax: ensureValidNumber(order.taxAmount) || 0,
        discount: ensureValidNumber(order.discountAmount) || 0
      }));

      return reply.send({
        data: mappedOrders,
        meta: {
          total,
          totalPages: Math.ceil(total / pagination.limit),
          currentPage: pagination.page,
          pageSize: pagination.limit
        }
      });
    } catch (error) {
      request.log.error('Error fetching public orders:', error);
      return reply.status(500).send({ message: 'Failed to fetch orders' });
    }
  });

  // Get specific order by ID
  fastify.get('/:orderId', {
    schema: {
      tags: ['Public Orders'],
      summary: 'Get a specific order by ID',
      description: 'Retrieve details of a specific order by its ID.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['orderId'],
        properties: {
          orderId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'string' },
            status: { type: 'string' },
            paymentStatus: { type: 'string' },
            paymentMethod: { type: 'string' },
            totalAmount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            trackingNumber: { type: 'string', nullable: true },
            shippingCarrier: { type: 'string', nullable: true },
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
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  productId: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'number' },
                  quantity: { type: 'number' },
                  image: { type: 'string', nullable: true },
                  sku: { type: 'string', nullable: true },
                  status: { type: 'string' }
                }
              }
            },
            subtotal: { type: 'number' },
            shippingCost: { type: 'number' },
            tax: { type: 'number' },
            discount: { type: 'number' }
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
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ message: 'Unauthorized - Invalid or expired token' });
      }
    }
  }, async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const { user } = request as any;
      // Check for userId directly in token payload
      const userId = user?.userId || user?.id;
      
      if (!userId) {
        // Log token content for debugging
        logger.debug('Token content in order detail request:', user);
        return reply.status(401).send({ message: 'Unauthorized - User ID not found in token' });
      }

      // Get the order
      const order = await orderController.orderService.getOrderById(orderId);

      if (!order) {
        return reply.status(404).send({ message: 'Order not found' });
      }

      // Check if the order belongs to the user from the JWT
      if (order.userId !== userId && !(user.roles && user.roles.includes('admin'))) {
        return reply.status(403).send({ message: 'You do not have permission to view this order' });
      }

      // Map the order to a format suitable for the frontend
      const mappedOrder = {
        id: order.id,
        orderNumber: order.orderNumber || `ORD-${order.id.substring(0, 8)}`,
        status: order.status,
        paymentStatus: order.paymentStatus || 'PENDING',
        paymentMethod: order.paymentMethod || 'N/A',
        totalAmount: ensureValidNumber(order.totalAmount),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        trackingNumber: order.trackingNumber,
        shippingCarrier: order.shippingCarrier || 'N/A',
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.getName(),
          price: ensureValidNumber(item.price),
          quantity: item.quantity,
          image: item.getImage(),
          sku: item.getSku(),
          status: item.status || order.status
        })),
        subtotal: ensureValidNumber(order.subtotal || order.totalAmount - (ensureValidNumber(order.taxAmount) || 0) - (ensureValidNumber(order.shippingAmount) || 0) + (ensureValidNumber(order.discountAmount) || 0)),
        shippingCost: ensureValidNumber(order.shippingAmount) || 0,
        tax: ensureValidNumber(order.taxAmount) || 0,
        discount: ensureValidNumber(order.discountAmount) || 0
      };

      return reply.send(mappedOrder);
    } catch (error) {
      request.log.error(`Error fetching public order ${(request.params as any).orderId}:`, error);
      return reply.status(500).send({ message: 'Failed to fetch order details' });
    }
  });
  
  // Cancel order endpoint
  fastify.post('/:orderId/cancel', {
    schema: {
      tags: ['Public Orders'],
      summary: 'Cancel an order',
      description: 'Cancel an existing order by its ID.',
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
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string' },
            message: { type: 'string' }
          }
        },
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
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        logger.warn('JWT verification failed in public cancel order endpoint:', err);
        reply.status(401).send({ message: 'Unauthorized - Invalid or expired token' });
      }
    }
  }, async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const body = request.body as any;
      const reason = body.reason || '';
      const bodyUserId = body.userId;
      const createdBy = body.createdBy;
      const userObj = body.user;
      
      const { user } = request as any;
      
      logger.debug(`Attempting to cancel order ${orderId} with reason: ${reason}`);
      logger.debug('User from token:', user);
      logger.debug('Request body:', body);
      
      // Extract user ID from multiple possible sources with priority:
      // 1. JWT token (user.userId or user.id)
      // 2. Request body (userId)
      // 3. Request body (createdBy)
      // 4. Request body (user.id)
      const userId = user?.userId || user?.id || bodyUserId || createdBy || userObj?.id;
      
      if (!userId) {
        logger.warn('User ID not found in token or request body for cancel order request');
        return reply.status(401).send({ message: 'Unauthorized - User ID not found in token or request' });
      }

      // Get the order
      const order = await orderController.orderService.getOrderById(orderId);

      if (!order) {
        logger.warn(`Order not found for cancellation: ${orderId}`);
        return reply.status(404).send({ message: 'Order not found' });
      }

      // Only check if users match if the user ID comes from the JWT
      // If it's from the request body, we trust the API gateway has verified permissions
      if ((user?.userId || user?.id) && 
          order.userId !== (user?.userId || user?.id) && 
          !(user?.roles && user?.roles.includes('admin'))) {
        logger.warn(`User ${userId} attempted to cancel order ${orderId} belonging to ${order.userId}`);
        return reply.status(403).send({ message: 'You do not have permission to cancel this order' });
      }

      // Cancel the order
      const cancelledOrder = await orderController.orderService.cancelOrder(orderId, userId, reason);
      logger.info(`Order ${orderId} successfully cancelled by user ${userId}`);
      
      return reply.send({
        id: cancelledOrder.id,
        status: cancelledOrder.status,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      logger.error(`Error cancelling public order ${(request.params as any).orderId}:`, error);
      
      if (error instanceof Error && error.message.includes('cannot be cancelled')) {
        return reply.status(400).send({ message: error.message });
      }
      
      return reply.status(500).send({ message: 'Failed to cancel order' });
    }
  });
} 