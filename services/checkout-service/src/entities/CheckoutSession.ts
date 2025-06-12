import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

export enum CheckoutStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED'
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  metadata?: Record<string, any>;
}

export interface PriceTotals {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
}

export interface Coupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountAmount: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

@Entity('checkout_sessions')
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: CheckoutStatus,
    default: CheckoutStatus.PENDING
  })
  status: CheckoutStatus;

  @Column({ type: 'jsonb', name: 'cart_snapshot' })
  cartSnapshot: CartItem[];

  @Column({ type: 'jsonb' })
  totals: {
    subtotal: number;
    tax: number;
    shippingCost: number;
    discount: number;
    total: number;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'discount_code', nullable: true })
  discountCode?: string;

  @Column({ name: 'payment_intent_id', nullable: true })
  paymentIntentId?: string;

  @Column({ name: 'shipping_method', default: 'STANDARD' })
  shippingMethod: string;

  @Column({ type: 'jsonb', name: 'shipping_address', nullable: true })
  shippingAddress?: Address;

  @Column({ type: 'jsonb', name: 'billing_address', nullable: true })
  billingAddress?: Address;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to calculate totals
  calculateTotals(coupon?: Coupon): PriceTotals {
    // Calculate subtotal
    const subtotal = this.cartSnapshot.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate discount if coupon is provided and valid
    let discount = 0;
    if (coupon) {
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * Number(coupon.discountAmount)) / 100;
      } else if (coupon.discountType === 'FIXED') {
        discount = Number(coupon.discountAmount);
      }
    }

    // Calculate final total
    const total = subtotal + this.shippingCost + this.tax - discount;

    return {
      subtotal,
      tax: this.tax,
      shippingCost: this.shippingCost,
      discount,
      total
    };
  }

  // Helper method to check if session is expired
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }
} 