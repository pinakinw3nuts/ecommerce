import { FindOptionsWhere, Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { OrderNote } from '../entities/OrderNote';
import { logger } from '../utils/logger';

// Define valid status transitions based on Order entity's OrderStatus
const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.FAILED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.FAILED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
  [OrderStatus.DELIVERED]: [], // Final state
  [OrderStatus.CANCELLED]: [], // Final state
  [OrderStatus.FAILED]: [], // Final state
};

// Helper function to check if a status transition is valid
function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

// Helper function to check if an order is cancellable
function isOrderCancellable(status: OrderStatus): boolean {
  return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(status);
}

export interface CreateOrderItemDto {
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
  status?: OrderStatus | OrderStatus[];
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
      
      // Set enhanced properties
      item.additionalImages = itemDto.additionalImages;
      item.variantName = itemDto.metadata?.variantName || itemDto.variantName;
      item.description = itemDto.description;
      item.originalPrice = itemDto.originalPrice;
      item.salePrice = itemDto.salePrice;
      item.brand = itemDto.brand;
      item.category = itemDto.category;
      item.attributes = itemDto.attributes;
      item.dimensions = itemDto.dimensions;
      item.slug = itemDto.slug;

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
      // First get the order with its items and notes
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['items', 'notes'],
      });
      
      if (!order) {
        return null;
      }
      
      // If we have customer fields already populated, return the order
      if (order.customerName && order.customerEmail) {
        return order;
      }
      
      // Otherwise, look up the user information from the database directly
      try {
        // Use the TypeORM repository to query the user table directly
        const userRepository = AppDataSource.getRepository('users');
        const user = await userRepository.findOne({
          where: { id: order.userId }
        });
        
        if (user) {
          order.customerName = user.name;
          order.customerEmail = user.email;
          order.customerPhone = user.phone_number || user.phoneNumber;
          
          // Save the order with the updated user information
          await this.orderRepository.save(order);
        }
      } catch (error) {
        logger.warn(`Failed to get user info for order ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue with the order as is
      }
      
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
        if (Array.isArray(filters.status)) {
          where.status = In(filters.status);
        } else {
          where.status = filters.status;
        }
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

      // If there are no orders, return early
      if (orders.length === 0) {
        return [orders, total];
      }

      // Get all unique user IDs from the orders
      const userIds = [...new Set(orders.map(order => order.userId))];
      
      try {
        // Query users directly from the database
        const userRepository = AppDataSource.getRepository('users');
        const users = await userRepository.find({
          where: { id: In(userIds) }
        });

        // Create a map of user ID to user data for quick lookups
        const userMap = new Map();
        users.forEach(user => {
          userMap.set(user.id, user);
        });

        // Populate order customer information
        for (const order of orders) {
          const user = userMap.get(order.userId);
          if (user) {
            if (!order.customerName) order.customerName = user.name;
            if (!order.customerEmail) order.customerEmail = user.email;
            if (!order.customerPhone) order.customerPhone = user.phone_number || user.phoneNumber;
          }
        }

        // Save the orders with the updated user info
        await this.orderRepository.save(orders);
      } catch (error) {
        logger.warn(`Failed to get user info for orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue with the orders as they are
      }

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
        if (Array.isArray(filters.status)) {
          where.status = In(filters.status);
        } else {
          where.status = filters.status;
        }
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

      // If there are no orders, return early
      if (orders.length === 0) {
        return [orders, total];
      }

      try {
        // Since all orders have the same userId, we can just query that one user
        const userRepository = AppDataSource.getRepository('users');
        const user = await userRepository.findOne({
          where: { id: userId }
        });

        if (user) {
          // Populate order customer information for all orders
          for (const order of orders) {
            if (!order.customerName) order.customerName = user.name;
            if (!order.customerEmail) order.customerEmail = user.email;
            if (!order.customerPhone) order.customerPhone = user.phone_number || user.phoneNumber;
          }

          // Save the orders with the updated user info
          await this.orderRepository.save(orders);
        }
      } catch (error) {
        logger.warn(`Failed to get user info for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue with the orders as they are
      }

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

      // Store the previous status for the note
      const previousStatus = order.status;
      
      // Update status
      order.status = newStatus;
      
      try {
        // Save order with updated status first
        const updatedOrder = await this.orderRepository.save(order);
        
        // Then create a note about the status change
        const note = new OrderNote();
        note.orderId = id; // Set the order ID explicitly
        note.adminId = adminId;
        note.content = `Order status changed from ${previousStatus} to ${newStatus}`;
        note.isInternal = true;
        note.createdBy = adminId;
        
        // Save the note
        await this.orderNoteRepository.save(note);
        
        logger.info(`Updated order ${id} status to ${newStatus}`);
        return updatedOrder;
      } catch (noteError) {
        // If there's an error with the note, log it but don't fail the status update
        logger.error(`Failed to create status change note for order ${id}:`, noteError);
        // Return the order anyway - the status was updated but we couldn't add the note
        const updatedOrder = await this.getOrderById(id);
        if (!updatedOrder) {
          throw new Error('Failed to retrieve updated order');
        }
        return updatedOrder;
      }
    } catch (error) {
      logger.error(`Failed to update order ${id} status:`, error);
      if (error instanceof Error) {
        throw error; // Preserve the original error message
      }
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string, userId: string, reason: string): Promise<Order> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      if (!isOrderCancellable(order.status)) {
        throw new Error(`Order cannot be cancelled in status ${order.status}`);
      }

      // Update order status and add cancellation reason
      order.status = OrderStatus.CANCELLED;
      order.metadata = {
        ...order.metadata,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
        cancelledBy: userId
      };

      // Save the order first to ensure the status is updated
      const updatedOrder = await this.orderRepository.save(order);

      // Add cancellation note
      const note = new OrderNote();
      note.orderId = id;
      note.adminId = userId;  // Using userId instead of adminId since it can be either user or admin
      note.content = `Order cancelled: ${reason}`;
      note.isInternal = false;
      note.createdBy = userId; // Set the required createdBy field
      await this.orderNoteRepository.save(note);

      logger.info(`Order ${id} cancelled by user ${userId} with reason: ${reason}`);
      
      // Fetch the order again with all relations to ensure we return the complete data
      const finalOrder = await this.getOrderById(id);
      if (!finalOrder) {
        throw new Error('Failed to fetch updated order');
      }

      return finalOrder;
    } catch (error) {
      logger.error(`Failed to cancel order ${id}:`, error);
      if (error instanceof Error) {
        throw error; // Re-throw the original error to preserve the message
      }
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
        throw new Error('Only orders in PENDING status can be confirmed');
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
      note.createdBy = adminId; // Set the createdBy field to the adminId

      const savedNote = await this.orderNoteRepository.save(note);
      logger.info(`Added note to order ${orderId}`);
      return savedNote;
    } catch (error) {
      logger.error(`Failed to add note to order ${orderId}:`, error);
      throw new Error('Failed to add order note');
    }
  }
} 