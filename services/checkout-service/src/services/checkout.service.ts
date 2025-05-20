import { Repository } from 'typeorm';
import { CheckoutSession, CheckoutStatus } from '../entities/CheckoutSession';
import { CouponService } from './coupon.service';
import { ShippingService } from './shipping.service';
import { logger } from '../utils/logger';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  metadata?: Record<string, any> | undefined;
}

interface OrderPreview {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  items: CartItem[];
}

const TAX_RATE = 0.10; // 10% tax rate

export class CheckoutService {
  constructor(
    private readonly checkoutSessionRepository: Repository<CheckoutSession>,
    private readonly couponService: CouponService,
    private readonly shippingService: ShippingService
  ) {}

  private calculateSubtotal(items: CartItem[]): number {
    return Number(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
    );
  }

  private calculateTax(subtotal: number): number {
    return Number((subtotal * TAX_RATE).toFixed(2));
  }

  private async calculateShippingCost(subtotal: number): Promise<number> {
    // Use shipping service to calculate cost
    return this.shippingService.calculateShippingCost(subtotal);
  }

  async calculateOrderPreview(
    userId: string,
    cartItems: CartItem[],
    couponCode?: string
  ): Promise<OrderPreview> {
    logger.info({ userId, itemCount: cartItems.length }, 'Calculating order preview');

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate base amounts
    const subtotal = this.calculateSubtotal(cartItems);
    const tax = this.calculateTax(subtotal);
    const shippingCost = await this.calculateShippingCost(subtotal);

    // Calculate discount if coupon provided
    let discount = 0;
    if (couponCode) {
      try {
        const { discountAmount } = await this.couponService.applyCoupon(
          couponCode,
          subtotal
        );
        discount = discountAmount;
      } catch (error: any) {
        // If coupon is invalid, continue with zero discount
        logger.warn({ userId, couponCode, error: error.message }, 'Invalid coupon applied');
      }
    }

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
    cartItems: CartItem[],
    couponCode?: string
  ): Promise<CheckoutSession> {
    const orderPreview = await this.calculateOrderPreview(userId, cartItems, couponCode);

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
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
    } as Partial<CheckoutSession>;

    const session = this.checkoutSessionRepository.create(sessionData);
    return this.checkoutSessionRepository.save(session);
  }

  async getCheckoutSession(sessionId: string): Promise<CheckoutSession | null> {
    return this.checkoutSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['coupon']
    });
  }

  async expireCheckoutSession(sessionId: string): Promise<void> {
    const session = await this.getCheckoutSession(sessionId);
    
    if (session?.discountCode) {
      // Release the coupon if it was used
      await this.couponService.releaseCoupon(session.discountCode);
    }

    await this.checkoutSessionRepository.update(
      { id: sessionId },
      { status: CheckoutStatus.EXPIRED }
    );
  }
} 