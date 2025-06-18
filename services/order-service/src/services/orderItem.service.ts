import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { OrderItem } from '../entities/OrderItem';
import { Order } from '../entities/Order';
import { logger } from '../utils/logger';

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  price: number;
  variantId?: string | null;
  metadata?: {
    name?: string;
    sku?: string;
    image?: string;
    variantName?: string;
    [key: string]: any;
  };
}

export interface UpdateOrderItemDto {
  quantity?: number;
  price?: number;
  metadata?: Record<string, any>;
}

export class OrderItemService {
  private orderItemRepository: Repository<OrderItem>;
  private orderRepository: Repository<Order>;

  constructor() {
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  /**
   * Create multiple order items for an order
   */
  async createOrderItems(orderId: string, items: CreateOrderItemDto[]): Promise<OrderItem[]> {
    try {
      const order = await this.orderRepository.findOneBy({ id: orderId });
      if (!order) {
        throw new Error('Order not found');
      }

      const orderItems = items.map(itemDto => {
        const item = new OrderItem();
        item.orderId = orderId;
        item.productId = itemDto.productId;
        item.quantity = itemDto.quantity;
        item.price = itemDto.price;
        item.variantId = itemDto.variantId ?? null;
        item.metadata = itemDto.metadata || {};
        item.discountAmount = 0;
        return item;
      });

      const savedItems = await this.orderItemRepository.save(orderItems);
      
      // Update order total
      await this.recalculateOrderTotal(orderId);
      
      logger.info(`Created ${savedItems.length} items for order ${orderId}`);
      return savedItems;
    } catch (error) {
      logger.error(`Failed to create order items for order ${orderId}:`, error);
      throw new Error('Failed to create order items');
    }
  }

  /**
   * Update an order item
   */
  async updateOrderItem(itemId: string, dto: UpdateOrderItemDto): Promise<OrderItem> {
    try {
      const item = await this.orderItemRepository.findOne({
        where: { id: itemId },
        relations: ['order'],
      });

      if (!item) {
        throw new Error('Order item not found');
      }

      if (dto.quantity !== undefined) {
        item.quantity = dto.quantity;
      }

      if (dto.price !== undefined) {
        item.price = dto.price;
      }

      if (dto.metadata) {
        item.metadata = { ...item.metadata, ...dto.metadata };
      }

      const updatedItem = await this.orderItemRepository.save(item);
      
      // Update order total
      await this.recalculateOrderTotal(item.orderId);
      
      logger.info(`Updated order item ${itemId}`);
      return updatedItem;
    } catch (error) {
      logger.error(`Failed to update order item ${itemId}:`, error);
      throw new Error('Failed to update order item');
    }
  }

  /**
   * Delete an order item
   */
  async deleteOrderItem(itemId: string): Promise<void> {
    try {
      const item = await this.orderItemRepository.findOneBy({ id: itemId });
      if (!item) {
        throw new Error('Order item not found');
      }

      const orderId = item.orderId;
      await this.orderItemRepository.remove(item);
      
      // Update order total
      await this.recalculateOrderTotal(orderId);
      
      logger.info(`Deleted order item ${itemId}`);
    } catch (error) {
      logger.error(`Failed to delete order item ${itemId}:`, error);
      throw new Error('Failed to delete order item');
    }
  }

  /**
   * Get all items for an order
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      const items = await this.orderItemRepository.find({
        where: { orderId },
        order: { createdAt: 'ASC' },
      });
      return items;
    } catch (error) {
      logger.error(`Failed to get items for order ${orderId}:`, error);
      throw new Error('Failed to get order items');
    }
  }

  /**
   * Recalculate order total based on items
   */
  private async recalculateOrderTotal(orderId: string): Promise<void> {
    try {
      const items = await this.getOrderItems(orderId);
      const totalAmount = items.reduce((sum, item) => sum + item.getSubtotal(), 0);

      await this.orderRepository.update(
        { id: orderId },
        { totalAmount }
      );

      logger.info(`Recalculated total for order ${orderId}: ${totalAmount}`);
    } catch (error) {
      logger.error(`Failed to recalculate total for order ${orderId}:`, error);
      throw new Error('Failed to recalculate order total');
    }
  }
} 