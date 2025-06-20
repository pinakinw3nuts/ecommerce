import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
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
  image?: string;
  sku?: string;
  metadata?: Record<string, any>;
}

export interface PriceTotals {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
}

export interface CouponData {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountAmount: number;
}

@Entity('checkout_sessions')
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ type: 'jsonb' })
  cartSnapshot: CartItem[];

  @Column({ type: 'jsonb' })
  totals: PriceTotals;

  @Column('decimal', { precision: 10, scale: 2 })
  shippingCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  tax: number;

  @Column({ nullable: true })
  discountCode: string;

  @Column({
    type: 'enum',
    enum: CheckoutStatus,
    default: CheckoutStatus.PENDING
  })
  status: CheckoutStatus;

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Helper method to calculate totals
  calculateTotals(couponData?: CouponData): PriceTotals {
    // Calculate subtotal
    const subtotal = this.cartSnapshot.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate discount if coupon is provided and valid
    let discount = 0;
    if (couponData) {
      if (couponData.discountType === 'PERCENTAGE') {
        discount = (subtotal * Number(couponData.discountAmount)) / 100;
      } else if (couponData.discountType === 'FIXED') {
        discount = Number(couponData.discountAmount);
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