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

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  metadata?: Record<string, any>;
}

interface PriceTotals {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
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
  calculateTotals(discountAmount: number = 0): PriceTotals {
    // Calculate subtotal
    const subtotal = this.cartSnapshot.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate final total
    const total = subtotal + this.shippingCost + this.tax - discountAmount;

    return {
      subtotal,
      tax: this.tax,
      shippingCost: this.shippingCost,
      discount: discountAmount,
      total
    };
  }

  // Helper method to check if session is expired
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }
} 