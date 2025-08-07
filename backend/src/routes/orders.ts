import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CheckoutService } from '../services/checkout.service';
import { OrderStatus } from '../entities/Order';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { requireUser } from '../middleware/auth';

const checkoutService = new CheckoutService();

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to format order response
function formatOrderResponse(order: any) {
  return order.toJSON();
}

// Zod schemas for validation
const orderQuerySchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val) || 1).optional().default(1),
  limit: z.string().or(z.number()).transform(val => Number(val) || 10).optional().default(10),
  status: z.nativeEnum(OrderStatus).optional(),
});

export default async function ordersRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all order routes
  fastify.addHook('preHandler', requireUser());

  // GET /api/orders - List orders for user
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const queryParams = orderQuerySchema.parse(request.query);
      
      logger.info('Getting orders for user:', { userId: user.userId, queryParams });

      const result = await checkoutService.getOrdersForUser(user.userId, {
        page: queryParams.page,
        limit: queryParams.limit,
        status: queryParams.status,
      });
      
      const formattedOrders = result.orders.map(formatOrderResponse);
      
      return reply.send({
        success: true,
        data: formattedOrders,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error getting orders for user:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid query parameters',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to get orders',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // GET /api/orders/:id - Get specific order by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const { id: orderId } = request.params;
      
      if (!isValidUUID(orderId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid order ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Getting order by ID:', { userId: user.userId, orderId });

      const order = await checkoutService.getOrderById(user.userId, orderId);
      
      if (!order) {
        return reply.status(404).send({
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND',
        });
      }
      
      return reply.send({
        success: true,
        data: formatOrderResponse(order),
      });
    } catch (error) {
      logger.error('Error getting order by ID:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get order',
        error: 'INTERNAL_ERROR',
      });
    }
  });
}