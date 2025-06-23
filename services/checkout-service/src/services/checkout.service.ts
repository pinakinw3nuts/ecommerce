import { Repository } from 'typeorm';
import { CheckoutSession, CheckoutStatus, CartItem, Coupon } from '../entities/CheckoutSession';
import { ShippingService } from './shipping.service';
import { logger } from '../utils/logger';
import axios from 'axios';
import { config } from '../config/env';

interface OrderPreview {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  items: CartItem[];
}

export class CheckoutService {
  constructor(
    private readonly checkoutSessionRepository: Repository<CheckoutSession>,
    private readonly shippingService: ShippingService
  ) {}

  private calculateSubtotal(items: CartItem[]): number {
    return Number(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
    );
  }

  private async calculateTax(subtotal: number, shippingAddress?: any): Promise<number> {
    try {
      // If we have a shipping address, use the tax API for accurate calculation
      if (shippingAddress) {
        const response = await axios.post(`${config.services.tax}/calculate`, {
          subtotal,
          address: shippingAddress
        });
        return Number(response.data.taxAmount.toFixed(2));
      }
      
      // Default tax calculation (fallback)
      const TAX_RATE = 0.10; // 10% tax rate
      return Number((subtotal * TAX_RATE).toFixed(2));
    } catch (error) {
      logger.error('Error calculating tax, using default rate:', error);
      // Fallback to default calculation
      const TAX_RATE = 0.10; // 10% tax rate
      return Number((subtotal * TAX_RATE).toFixed(2));
    }
  }

  private async calculateShippingCost(subtotal: number, shippingAddress?: any): Promise<number> {
    if (shippingAddress) {
      // Use shipping service to calculate cost based on address
      return this.shippingService.calculateShippingCostByAddress(subtotal, shippingAddress);
    }
    // Use basic shipping service calculation
    return this.shippingService.calculateShippingCost(subtotal);
  }

  async fetchCoupon(couponCode: string): Promise<Coupon | null> {
    try {
      const response = await axios.get(`${config.services.product}/coupons/${couponCode}`);
      if (response.data && response.data.success) {
        return response.data.coupon;
      }
      return null;
    } catch (error) {
      logger.warn(`Failed to fetch coupon ${couponCode}:`, error);
      return null;
    }
  }

  async calculateDiscount(subtotal: number, couponCode?: string): Promise<number> {
    if (!couponCode) return 0;
    
    try {
      const coupon = await this.fetchCoupon(couponCode);
      if (!coupon) return 0;
      
      let discount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * coupon.discountAmount) / 100;
      } else if (coupon.discountType === 'FIXED') {
        discount = coupon.discountAmount;
      }
      
      return Number(discount.toFixed(2));
    } catch (error) {
      logger.error(`Error calculating discount for coupon ${couponCode}:`, error);
      return 0;
    }
  }

  async calculateOrderPreview(
    userId: string,
    cartItems: CartItem[],
    couponCode?: string,
    shippingAddress?: any
  ): Promise<OrderPreview> {
    logger.info({ userId, itemCount: cartItems.length }, 'Calculating order preview');

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate base amounts
    const subtotal = this.calculateSubtotal(cartItems);
    const tax = await this.calculateTax(subtotal, shippingAddress);
    const shippingCost = await this.calculateShippingCost(subtotal, shippingAddress);

    // Calculate discount if coupon provided
    const discount = await this.calculateDiscount(subtotal, couponCode);

    // Calculate final total
    const total = Number(
      (subtotal + tax + shippingCost - discount).toFixed(2)
    );

    const preview = {
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      items: cartItems
    };

    logger.info({ userId, preview }, 'Order preview calculated');
    return preview;
  }

  async createCheckoutSession(
    userId: string,
    cartItems: any[], // Accepts cart items with productSnapshot
    couponCode?: string,
    shippingAddress?: any,
    billingAddress?: any
  ): Promise<CheckoutSession> {
    // Map cartItems to ensure all product details are present
    const mappedCartItems = cartItems.map(item => {
      // Initialize with basic properties
      const mappedItem: any = {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name || 'Unknown Product'
      };
      
      // Extract data from productSnapshot if available
      if (item.productSnapshot) {
        // Basic product details
        mappedItem.name = item.productSnapshot.name || mappedItem.name;
        mappedItem.description = item.productSnapshot.description;
        mappedItem.image = item.productSnapshot.imageUrl;
        mappedItem.additionalImages = item.productSnapshot.additionalImages;
        mappedItem.sku = item.productSnapshot.sku;
        mappedItem.variantId = item.variantId;
        mappedItem.variantName = item.productSnapshot.variantName;
        
        // E-commerce specific details
        mappedItem.brand = item.productSnapshot.brand;
        mappedItem.category = item.productSnapshot.category;
        mappedItem.attributes = item.productSnapshot.attributes;
        mappedItem.dimensions = item.productSnapshot.dimensions;
        mappedItem.originalPrice = item.productSnapshot.originalPrice;
        mappedItem.salePrice = item.productSnapshot.salePrice;
        mappedItem.slug = item.productSnapshot.slug;
        
        // Preserve all metadata
        mappedItem.metadata = item.productSnapshot.metadata || {};
      }
      
      return mappedItem;
    });
    
    const orderPreview = await this.calculateOrderPreview(
      userId, 
      mappedCartItems, 
      couponCode,
      shippingAddress
    );
    const sessionData = {
      userId,
      cartSnapshot: orderPreview.items,
      totals: {
        subtotal: orderPreview.subtotal,
        tax: orderPreview.tax,
        shippingCost: orderPreview.shippingCost,
        discount: orderPreview.discount,
        total: orderPreview.total
      },
      shippingCost: orderPreview.shippingCost,
      tax: orderPreview.tax,
      discountCode: couponCode,
      status: CheckoutStatus.PENDING,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
      shippingAddress,
      billingAddress
    } as Partial<CheckoutSession>;
    const session = this.checkoutSessionRepository.create(sessionData);
    return this.checkoutSessionRepository.save(session);
  }

  async getCheckoutSession(sessionId: string): Promise<CheckoutSession | null> {
    return this.checkoutSessionRepository.findOne({
      where: { id: sessionId }
    });
  }

  async updateCheckoutSession(
    sessionId: string, 
    updateData: Partial<CheckoutSession>
  ): Promise<CheckoutSession | null> {
    await this.checkoutSessionRepository.update(
      { id: sessionId },
      updateData
    );
    
    return this.getCheckoutSession(sessionId);
  }

  async updateShippingAddress(
    sessionId: string,
    address: any
  ): Promise<CheckoutSession | null> {
    logger.info({ sessionId, address }, 'Updating shipping address for checkout session');
    const updatedSession = await this.updateCheckoutSession(sessionId, { shippingAddress: address });
    if (!updatedSession) {
      logger.warn({ sessionId }, 'Checkout session not found for shipping address update');
    }
    return updatedSession;
  }

  async completeCheckoutSession(
    sessionId: string, 
    paymentIntentId: string
  ): Promise<CheckoutSession | null> {
    return this.updateCheckoutSession(sessionId, {
      status: CheckoutStatus.COMPLETED,
      paymentIntentId
    });
  }

  async expireCheckoutSession(sessionId: string): Promise<void> {
    await this.checkoutSessionRepository.update(
      { id: sessionId },
      { status: CheckoutStatus.EXPIRED }
    );
  }

  async failCheckoutSession(sessionId: string, reason?: string): Promise<void> {
    logger.warn(`Checkout session ${sessionId} failed: ${reason || 'No reason provided'}`);
    
    await this.checkoutSessionRepository.update(
      { id: sessionId },
      { status: CheckoutStatus.FAILED }
    );
  }
} 