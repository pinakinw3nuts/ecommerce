import { FindOptionsWhere, Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { OrderNote } from '../entities/OrderNote';
import { logger } from '../utils/logger';
import { isOrderCancellable, isValidStatusTransition } from '../utils/status';

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  price: number;
  variantId?: string;
  name: string;
  image: string;
  sku: string;
  metadata?: {
    name?: string;
    sku?: string;
    image?: string;
    variantName?: string;
    [key: string]: any;
  };
}

export interface CreateOrderDto {
  userId: string;
  items: CreateOrderItemDto[];
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
  subtotal?: number;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
}

export interface UpdateOrderDto {
  shippingAddress?: {
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
  trackingNumber?: string;
  metadata?: Record<string, any>;
}

export interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export class OrderService {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;
  private orderNoteRepository: Repository<OrderNote>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.orderNoteRepository = AppDataSource.getRepository(OrderNote);
  }

  /**
   * Create a new order
   */
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const order = new Order();
    order.userId = dto.userId;
    order.shippingAddress = dto.shippingAddress;
    order.billingAddress = dto.billingAddress || dto.shippingAddress;
    order.metadata = dto.metadata || {};
    order.generateOrderNumber(); // Generate a unique order number

    // Create order items
    order.items = dto.items.map(itemDto => {
      const item = new OrderItem();
      item.productId = itemDto.productId;
      item.quantity = itemDto.quantity;
      item.price = itemDto.price;
      item.variantId = itemDto.variantId ?? null;
      item.name = itemDto.metadata?.name || itemDto.name;
      item.sku = itemDto.metadata?.sku || itemDto.sku;
      item.image = itemDto.metadata?.image || itemDto.image;

      // Set properties from metadata if available
      if (itemDto.metadata) {
        item.metadata = itemDto.metadata;        
      }

      return item;
    });

    // Set totals from DTO if provided
    order.subtotal = dto.subtotal ?? 0;
    order.taxAmount = dto.taxAmount ?? 0;
    order.shippingAmount = dto.shippingAmount ?? 0;
    order.discountAmount = dto.discountAmount ?? 0;
    order.totalAmount = dto.totalAmount ?? 0;

    try {

      const savedOrder = await this.orderRepository.save(order);
      logger.info(`Created order ${savedOrder.id} for user ${dto.userId}`);
      return savedOrder;
    } catch (error) {
      logger.error('Failed to create order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['items', 'notes'],
      });
      return order;
    } catch (error) {
      logger.error(`Failed to get order ${id}:`, error);
      throw new Error('Failed to get order');
    }
  }

  /**
   * Get all orders with pagination and filters (for admin and internal use)
   */
  async getOrders(
    filters: OrderFilters = {},
    pagination: PaginationOptions
  ): Promise<[Order[], number]> {
    try {
      const where: FindOptionsWhere<Order> = {};

      // Apply filters
      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = Between(
          filters.startDate || new Date(0),
          filters.endDate || new Date()
        );
      }

      if (filters.minAmount) {
        where.totalAmount = MoreThanOrEqual(filters.minAmount);
      }

      if (filters.maxAmount) {
        where.totalAmount = LessThanOrEqual(filters.maxAmount);
      }

      // Get the orders with pagination
      const [orders, total] = await this.orderRepository.findAndCount({
        where,
        relations: ['items'],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        order: {
          [pagination.sortBy || 'createdAt']: pagination.order || 'DESC',
        },
      });

      return [orders, total];
    } catch (error) {
      logger.error('Failed to get orders:', error);
      throw new Error('Failed to get orders');
    }
  }

  /**
   * Get orders by user ID with pagination and filters
   */
  async getOrdersByUserId(
    userId: string,
    filters: OrderFilters = {},
    pagination: PaginationOptions
  ): Promise<[Order[], number]> {
    try {
      const where: FindOptionsWhere<Order> = { userId };

      // Apply filters
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = Between(
          filters.startDate || new Date(0),
          filters.endDate || new Date()
        );
      }

      if (filters.minAmount) {
        where.totalAmount = MoreThanOrEqual(filters.minAmount);
      }

      if (filters.maxAmount) {
        where.totalAmount = LessThanOrEqual(filters.maxAmount);
      }

      const [orders, total] = await this.orderRepository.findAndCount({
        where,
        relations: ['items'],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        order: {
          [pagination.sortBy || 'createdAt']: pagination.order || 'DESC',
        },
      });

      return [orders, total];
    } catch (error) {
      logger.error(`Failed to get orders for user ${userId}:`, error);
      throw new Error('Failed to get orders');
    }
  }

  /**
   * Update order details
   */
  async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      if (dto.shippingAddress) {
        order.shippingAddress = dto.shippingAddress;
      }

      if (dto.billingAddress) {
        order.billingAddress = dto.billingAddress;
      }

      if (dto.trackingNumber) {
        order.trackingNumber = dto.trackingNumber;
      }

      if (dto.metadata) {
        order.metadata = { ...order.metadata, ...dto.metadata };
      }

      const updatedOrder = await this.orderRepository.save(order);
      logger.info(`Updated order ${id}`);
      return updatedOrder;
    } catch (error) {
      logger.error(`Failed to update order ${id}:`, error);
      throw new Error('Failed to update order');
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, newStatus: OrderStatus, adminId: string): Promise<Order> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      if (!isValidStatusTransition(order.status, newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
      }

      order.status = newStatus;

      // Add system note for status change
      const note = new OrderNote();
      note.orderId = id;
      note.adminId = adminId;
      note.content = `Order status changed from ${order.status} to ${newStatus}`;
      note.isInternal = true;
      await this.orderNoteRepository.save(note);

      const updatedOrder = await this.orderRepository.save(order);
      logger.info(`Updated order ${id} status to ${newStatus}`);
      return updatedOrder;
    } catch (error) {
      logger.error(`Failed to update order ${id} status:`, error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string, adminId: string, reason: string): Promise<Order> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      if (!isOrderCancellable(order.status)) {
        throw new Error(`Order cannot be cancelled in status ${order.status}`);
      }

      order.status = OrderStatus.CANCELLED;

      // Add cancellation note
      const note = new OrderNote();
      note.orderId = id;
      note.adminId = adminId;
      note.content = `Order cancelled: ${reason}`;
      note.isInternal = false;
      await this.orderNoteRepository.save(note);

      const updatedOrder = await this.orderRepository.save(order);
      logger.info(`Cancelled order ${id}`);
      return updatedOrder;
    } catch (error) {
      logger.error(`Failed to cancel order ${id}:`, error);
      throw new Error('Failed to cancel order');
    }
  }

  /**
   * Confirm order
   */
  async confirmOrder(id: string, adminId: string): Promise<Order> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new Error('Only pending orders can be confirmed');
      }

      order.status = OrderStatus.CONFIRMED;

      // Add confirmation note
      const note = new OrderNote();
      note.orderId = id;
      note.adminId = adminId;
      note.content = 'Order confirmed';
      note.isInternal = true;
      await this.orderNoteRepository.save(note);

      const updatedOrder = await this.orderRepository.save(order);
      logger.info(`Confirmed order ${id}`);
      return updatedOrder;
    } catch (error) {
      logger.error(`Failed to confirm order ${id}:`, error);
      throw new Error('Failed to confirm order');
    }
  }

  /**
   * Add note to order
   */
  async addOrderNote(
    orderId: string,
    adminId: string,
    content: string,
    isInternal = false
  ): Promise<OrderNote> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const note = new OrderNote();
      note.orderId = orderId;
      note.adminId = adminId;
      note.content = content;
      note.isInternal = isInternal;

      const savedNote = await this.orderNoteRepository.save(note);
      logger.info(`Added note to order ${orderId}`);
      return savedNote;
    } catch (error) {
      logger.error(`Failed to add note to order ${orderId}:`, error);
      throw new Error('Failed to add order note');
    }
  }
} 