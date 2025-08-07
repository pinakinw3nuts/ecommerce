import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Order, OrderStatus, PaymentStatus, ShippingMethod, ShippingAddress, BillingAddress } from '../entities/Order';
import { OrderItem, ProductSnapshot } from '../entities/OrderItem';
import { Cart } from '../entities/Cart';
import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';
import { CartService } from './cart.service';
import { logger } from '../utils/logger';

export interface CheckoutValidationResult {
  isValid: boolean;
  issues: string[];
  cartTotal: number;
  itemCount: number;
}

export interface ShippingCalculation {
  method: ShippingMethod;
  cost: number;
  estimatedDays: number;
  description: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export interface PlaceOrderOptions {
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  shippingMethod?: ShippingMethod;
  paymentMethod?: string;
  discountCode?: string;
  notes?: string;
}

export class CheckoutService {
  private orderRepo: Repository<Order>;
  private orderItemRepo: Repository<OrderItem>;
  private productRepo: Repository<Product>;
  private variantRepo: Repository<ProductVariant>;
  private cartService: CartService;

  constructor() {
    this.orderRepo = AppDataSource.getRepository(Order);
    this.orderItemRepo = AppDataSource.getRepository(OrderItem);
    this.productRepo = AppDataSource.getRepository(Product);
    this.variantRepo = AppDataSource.getRepository(ProductVariant);
    this.cartService = new CartService();
  }

  /**
   * Validate cart before checkout
   */
  async validateCart(userId: string): Promise<CheckoutValidationResult> {
    logger.info('Validating cart for checkout:', { userId });

    try {
      const cart = await this.cartService.getCart(userId);
      const issues: string[] = [];

      if (!cart.items || cart.items.length === 0) {
        issues.push('Cart is empty');
        return {
          isValid: false,
          issues,
          cartTotal: 0,
          itemCount: 0,
        };
      }

      // Validate each cart item
      for (const item of cart.items) {
        // Check if product still exists and is published
        const product = await this.productRepo.findOne({
          where: { id: item.productId },
          relations: ['variants'],
        });

        if (!product) {
          issues.push(`Product "${item.productSnapshot.name}" is no longer available`);
          continue;
        }

        if (!product.isPublished) {
          issues.push(`Product "${item.productSnapshot.name}" is no longer published`);
          continue;
        }

        // Check variant if applicable
        if (item.variantId) {
          const variant = product.variants?.find(v => v.id === item.variantId);
          if (!variant) {
            issues.push(`Variant for "${item.productSnapshot.name}" is no longer available`);
            continue;
          }

          // Check price changes
          if (Number(item.price) !== Number(variant.price)) {
            issues.push(`Price for "${item.productSnapshot.name}" has changed from $${item.price} to $${variant.price}`);
          }
        } else {
          // Check product price changes
          if (Number(item.price) !== Number(product.price)) {
            issues.push(`Price for "${item.productSnapshot.name}" has changed from $${item.price} to $${product.price}`);
          }
        }
      }

      const isValid = issues.length === 0;
      logger.info('Cart validation completed:', { userId, isValid, issuesCount: issues.length });

      return {
        isValid,
        issues,
        cartTotal: Number(cart.total),
        itemCount: cart.itemCount,
      };
    } catch (error) {
      logger.error('Error validating cart:', error);
      throw error;
    }
  }

  /**
   * Calculate shipping costs
   */
  async calculateShipping(
    userId: string,
    shippingAddress: ShippingAddress,
    method?: ShippingMethod
  ): Promise<ShippingCalculation[]> {
    logger.info('Calculating shipping costs:', { userId, method });

    try {
      const cart = await this.cartService.getCart(userId);
      const cartTotal = Number(cart.total);

      // Simple shipping calculation logic (can be enhanced with real shipping APIs)
      const calculations: ShippingCalculation[] = [];

      // Standard shipping
      calculations.push({
        method: ShippingMethod.STANDARD,
        cost: cartTotal > 50 ? 0 : 9.99, // Free shipping over $50
        estimatedDays: 5,
        description: 'Standard shipping (5-7 business days)',
      });

      // Express shipping
      calculations.push({
        method: ShippingMethod.EXPRESS,
        cost: cartTotal > 100 ? 9.99 : 19.99, // Discounted express over $100
        estimatedDays: 2,
        description: 'Express shipping (2-3 business days)',
      });

      // Overnight shipping
      calculations.push({
        method: ShippingMethod.OVERNIGHT,
        cost: 29.99,
        estimatedDays: 1,
        description: 'Overnight shipping (next business day)',
      });

      // Pickup option
      calculations.push({
        method: ShippingMethod.PICKUP,
        cost: 0,
        estimatedDays: 0,
        description: 'Store pickup (available immediately)',
      });

      // If specific method requested, return only that one
      if (method) {
        const selectedMethod = calculations.find(calc => calc.method === method);
        return selectedMethod ? [selectedMethod] : calculations;
      }

      logger.info('Shipping calculations completed:', { userId, optionsCount: calculations.length });
      return calculations;
    } catch (error) {
      logger.error('Error calculating shipping:', error);
      throw error;
    }
  }

  /**
   * Process payment (stub implementation)
   */
  async processPayment(
    userId: string,
    amount: number,
    paymentMethod: string = 'card'
  ): Promise<PaymentResult> {
    logger.info('Processing payment:', { userId, amount, paymentMethod });

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock payment success (90% success rate)
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        logger.info('Payment processed successfully:', { userId, paymentIntentId, amount });
        
        return {
          success: true,
          paymentIntentId,
        };
      } else {
        logger.warn('Payment failed:', { userId, amount });
        
        return {
          success: false,
          error: 'Payment was declined. Please try a different payment method.',
        };
      }
    } catch (error) {
      logger.error('Error processing payment:', error);
      return {
        success: false,
        error: 'Payment processing failed. Please try again.',
      };
    }
  }

  /**
   * Calculate tax (simplified implementation)
   */
  private calculateTax(subtotal: number, shippingAddress: ShippingAddress): number {
    // Simple tax calculation based on state (can be enhanced with real tax APIs)
    const taxRates: Record<string, number> = {
      'CA': 0.0875, // California
      'NY': 0.08,   // New York
      'TX': 0.0625, // Texas
      'FL': 0.06,   // Florida
    };

    const taxRate = taxRates[shippingAddress.state] || 0.05; // Default 5% tax
    return Number((subtotal * taxRate).toFixed(2));
  }

  /**
   * Place order
   */
  async placeOrder(userId: string, options: PlaceOrderOptions): Promise<Order> {
    logger.info('Placing order:', { userId, options: { ...options, billingAddress: '***' } });

    try {
      // Validate cart first
      const validation = await this.validateCart(userId);
      if (!validation.isValid) {
        throw new Error(`Cart validation failed: ${validation.issues.join(', ')}`);
      }

      // Get user's cart
      const cart = await this.cartService.getCart(userId);

      // Calculate shipping
      const shippingCalculations = await this.calculateShipping(
        userId,
        options.shippingAddress,
        options.shippingMethod || ShippingMethod.STANDARD
      );
      const shippingCost = shippingCalculations[0]?.cost || 0;

      // Calculate tax
      const tax = this.calculateTax(Number(cart.total), options.shippingAddress);

      // Calculate discount (placeholder for coupon logic)
      const discount = 0; // TODO: Implement coupon/discount logic

      // Create order
      const order = this.orderRepo.create({
        userId,
        orderNumber: '', // Will be generated after save
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: Number(cart.total),
        tax,
        shippingCost,
        discount,
        total: Number(cart.total) + tax + shippingCost - discount,
        itemCount: cart.itemCount,
        shippingAddress: options.shippingAddress,
        billingAddress: options.billingAddress || null,
        shippingMethod: options.shippingMethod || ShippingMethod.STANDARD,
        paymentMethod: options.paymentMethod || null,
        discountCode: options.discountCode || null,
        notes: options.notes || null,
        metadata: {
          cartId: cart.id,
          checkoutTimestamp: new Date().toISOString(),
        },
      });

      // Generate order number
      order.orderNumber = order.generateOrderNumber();

      // Save order
      const savedOrder = await this.orderRepo.save(order);

      // Create order items from cart items
      const orderItems: OrderItem[] = [];
      for (const cartItem of cart.items) {
        const orderItem = this.orderItemRepo.create({
          orderId: savedOrder.id,
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          quantity: cartItem.quantity,
          price: cartItem.price,
          productSnapshot: cartItem.productSnapshot as ProductSnapshot,
        });

        const savedOrderItem = await this.orderItemRepo.save(orderItem);
        orderItems.push(savedOrderItem);
      }

      // Update order with items
      savedOrder.items = orderItems;
      savedOrder.calculateTotals();
      await this.orderRepo.save(savedOrder);

      // Process payment
      const paymentResult = await this.processPayment(
        userId,
        Number(savedOrder.total),
        options.paymentMethod
      );

      if (paymentResult.success) {
        savedOrder.paymentStatus = PaymentStatus.PAID;
        savedOrder.paymentIntentId = paymentResult.paymentIntentId || null;
        savedOrder.updateStatus(OrderStatus.CONFIRMED);
        await this.orderRepo.save(savedOrder);

        // Clear user's cart after successful payment
        await this.cartService.clearCart(userId);

        logger.info('Order placed successfully:', {
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          userId,
          total: savedOrder.total,
        });
      } else {
        savedOrder.paymentStatus = PaymentStatus.FAILED;
        savedOrder.updateStatus(OrderStatus.CANCELLED);
        await this.orderRepo.save(savedOrder);

        logger.warn('Order payment failed:', {
          orderId: savedOrder.id,
          userId,
          error: paymentResult.error,
        });

        throw new Error(paymentResult.error || 'Payment failed');
      }

      return savedOrder;
    } catch (error) {
      logger.error('Error placing order:', error);
      throw error;
    }
  }

  /**
   * Get order by ID for user
   */
  async getOrderById(userId: string, orderId: string): Promise<Order | null> {
    logger.info('Getting order by ID:', { userId, orderId });

    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderId, userId },
        relations: ['items'],
      });

      if (!order) {
        logger.warn('Order not found:', { userId, orderId });
        return null;
      }

      logger.info('Order found:', { orderId, orderNumber: order.orderNumber });
      return order;
    } catch (error) {
      logger.error('Error getting order by ID:', error);
      throw error;
    }
  }

  /**
   * Get orders for user
   */
  async getOrdersForUser(
    userId: string,
    options?: { page?: number; limit?: number; status?: OrderStatus }
  ): Promise<{ orders: Order[]; pagination: any }> {
    const { page = 1, limit = 10, status } = options || {};
    logger.info('Getting orders for user:', { userId, page, limit, status });

    try {
      const queryBuilder = this.orderRepo.createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .where('order.userId = :userId', { userId })
        .orderBy('order.createdAt', 'DESC');

      if (status) {
        queryBuilder.andWhere('order.status = :status', { status });
      }

      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [orders, total] = await queryBuilder.getManyAndCount();

      logger.info('Orders retrieved:', { userId, count: orders.length, total });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting orders for user:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    logger.info('Updating order status:', { orderId, status });

    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        throw new Error('Order not found');
      }

      order.updateStatus(status);
      const updatedOrder = await this.orderRepo.save(order);

      logger.info('Order status updated:', { orderId, newStatus: status });
      return updatedOrder;
    } catch (error) {
      logger.error('Error updating order status:', error);
      throw error;
    }
  }
}