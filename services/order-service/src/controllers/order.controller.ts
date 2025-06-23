import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { OrderService, CreateOrderDto, OrderFilters, PaginationOptions } from '../services/order.service';
import { OrderStatus } from '../entities/Order';
import { logger } from '../utils/logger';

// Define custom user type
type CustomUser = {
  id: string;
  roles?: string[];
};

// Request types with auth
type AuthenticatedRequest<T extends RouteGenericInterface> = FastifyRequest<T> & {
  user: CustomUser;
};

// Request types
interface CreateOrderBody {
  items: {
    productId: string;
    quantity: number;
    price: number;
    variantId?: string;
    name: string;
    image: string;
    sku: string;
    additionalImages?: string[];
    variantName?: string;
    description?: string;
    originalPrice?: number;
    salePrice?: number;
    brand?: {
      id?: string;
      name?: string;
      logoUrl?: string;
    };
    category?: {
      id?: string;
      name?: string;
    };
    attributes?: {
      [key: string]: string | number | boolean;
    };
    dimensions?: {
      width?: number;
      height?: number;
      depth?: number;
      weight?: number;
      unit?: string;
    };
    slug?: string;
    metadata?: {
      name?: string;
      sku?: string;
      image?: string;
      variantName?: string;
      [key: string]: any;
    };
  }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  metadata?: Record<string, any>;
}

interface UpdateStatusBody {
  status: OrderStatus;
}

interface CancelOrderBody {
  reason: string;
}

interface OrderQuerystring {
  page?: string;
  limit?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface RequestParams {
  id: string;
}

export class OrderController {
  public orderService: OrderService;

  constructor(orderService?: OrderService) {
    // Use provided service or create a new one
    this.orderService = orderService || new OrderService();
  }

  /**
   * Create a new order
   */
  async createOrder(
    request: AuthenticatedRequest<{
      Body: CreateOrderBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const orderData: CreateOrderDto = {
        userId,
        ...request.body,
      };

      const order = await this.orderService.createOrder(orderData);
      logger.info(`Created order ${order.id} for user ${userId}`);
      return reply.status(201).send(order);
    } catch (error) {
      logger.error('Failed to create order:', error);
      return reply.status(500).send({ message: 'Failed to create order' });
    }
  }

  /**
   * Get orders for authenticated user
   */
  async getOrders(
    request: AuthenticatedRequest<{
      Querystring: OrderQuerystring;
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const { page, limit, status, startDate, endDate, minAmount, maxAmount, sortBy, order } = request.query;

      const filters: OrderFilters = {
        status: status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
      };

      const pagination: PaginationOptions = {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        sortBy: sortBy,
        order: order,
      };

      const [orders, total] = await this.orderService.getOrdersByUserId(
        userId,
        filters,
        pagination
      );

      return reply.send({
        orders,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit),
        },
      });
    } catch (error) {
      logger.error('Failed to get orders:', error);
      return reply.status(500).send({ message: 'Failed to get orders' });
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(
    request: AuthenticatedRequest<{
      Params: RequestParams;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const order = await this.orderService.getOrderById(id);

      if (!order) {
        return reply.status(404).send({ message: 'Order not found' });
      }

      // Ensure user can only access their own orders
      if (order.userId !== userId) {
        return reply.status(403).send({ message: 'Forbidden' });
      }

      return reply.send(order);
    } catch (error) {
      logger.error(`Failed to get order ${request.params.id}:`, error);
      return reply.status(500).send({ message: 'Failed to get order' });
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    request: AuthenticatedRequest<{
      Params: RequestParams;
      Body: UpdateStatusBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { status } = request.body;
      const adminId = request.user?.id;

      if (!adminId) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      // Verify admin role (assuming request.user has roles)
      if (!request.user?.roles?.includes('admin')) {
        return reply.status(403).send({ message: 'Forbidden' });
      }

      const order = await this.orderService.updateOrderStatus(id, status, adminId);
      logger.info(`Updated order ${id} status to ${status}`);
      return reply.send(order);
    } catch (error) {
      logger.error(`Failed to update order ${request.params.id} status:`, error);
      if (error instanceof Error && error.message.includes('Invalid status transition')) {
        return reply.status(400).send({ message: error.message });
      }
      return reply.status(500).send({ message: 'Failed to update order status' });
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    request: AuthenticatedRequest<{
      Params: RequestParams;
      Body: CancelOrderBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      
      const { id } = request.params;
      const { reason } = request.body;
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const order = await this.orderService.getOrderById(id);

      if (!order) {
        return reply.status(404).send({ message: 'Order not found' });
      }

      // Only allow users to cancel their own orders or admins to cancel any order
      if (order.userId !== userId && !request.user?.roles?.includes('admin')) {
        return reply.status(403).send({ message: 'Forbidden' });
      }

      const cancelledOrder = await this.orderService.cancelOrder(id, userId, reason);
      logger.info(`Cancelled order ${id}`);
      return reply.send(cancelledOrder);
    } catch (error) {
      logger.error(`Failed to cancel order ${request.params.id}:`, error);
      if (error instanceof Error && error.message.includes('cannot be cancelled')) {
        return reply.status(400).send({ message: error.message });
      }
      return reply.status(500).send({ message: 'Failed to cancel order' });
    }
  }
} 