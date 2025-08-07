import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrderItem } from './OrderItem';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum ShippingMethod {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  PICKUP = 'PICKUP'
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
}

export interface OrderJSON {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: any[];
  totals: OrderTotals;
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod?: string;
  paymentIntentId?: string;
  discountCode?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { unique: true })
  @Index()
  orderNumber!: string;

  @Column('varchar')
  @Index()
  userId!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status!: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  paymentStatus!: PaymentStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tax!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingCost!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total!: number;

  @Column('integer', { default: 0 })
  itemCount!: number;

  @Column('jsonb')
  shippingAddress!: ShippingAddress;

  @Column('jsonb', { nullable: true })
  billingAddress!: BillingAddress | null;

  @Column({
    type: 'enum',
    enum: ShippingMethod,
    default: ShippingMethod.STANDARD
  })
  shippingMethod!: ShippingMethod;

  @Column('varchar', { nullable: true })
  paymentMethod!: string | null;

  @Column('varchar', { nullable: true })
  paymentIntentId!: string | null;

  @Column('varchar', { nullable: true })
  discountCode!: string | null;

  @Column('text', { nullable: true })
  notes!: string | null;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, unknown> | null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column('timestamp', { nullable: true })
  confirmedAt!: Date | null;

  @Column('timestamp', { nullable: true })
  shippedAt!: Date | null;

  @Column('timestamp', { nullable: true })
  deliveredAt!: Date | null;

  /**
   * Calculate order totals
   */
  calculateTotals(): void {
    if (!this.items) {
      this.items = [];
    }
    
    // Calculate subtotal from items
    this.subtotal = this.items.reduce(
      (sum, item) => {
        const price = typeof item.price === 'string' ? Number(item.price) : item.price;
        return sum + item.quantity * price;
      },
      0
    );
    
    // Calculate total item count
    this.itemCount = this.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    
    // Calculate final total
    this.total = this.subtotal + this.tax + this.shippingCost - this.discount;
  }

  /**
   * Generate order number
   */
  generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Check if order can be cancelled
   */
  canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status);
  }

  /**
   * Check if order can be refunded
   */
  canBeRefunded(): boolean {
    return [OrderStatus.DELIVERED].includes(this.status) && 
           this.paymentStatus === PaymentStatus.PAID;
  }

  /**
   * Update order status with timestamp
   */
  updateStatus(status: OrderStatus): void {
    this.status = status;
    
    switch (status) {
      case OrderStatus.CONFIRMED:
        this.confirmedAt = new Date();
        break;
      case OrderStatus.SHIPPED:
        this.shippedAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        this.deliveredAt = new Date();
        break;
    }
  }

  /**
   * Convert to JSON for response
   */
  toJSON(): OrderJSON {
    // Calculate totals before converting to JSON
    this.calculateTotals();
    
    // Ensure items is initialized
    const items = Array.isArray(this.items) ? this.items : [];
    
    // Map item array
    const serializedItems = items.map(item => {
      if (typeof item.toJSON === 'function') {
        return item.toJSON();
      }
      return item;
    });
    
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      userId: this.userId,
      status: this.status,
      paymentStatus: this.paymentStatus,
      items: serializedItems,
      totals: {
        subtotal: Number(this.subtotal),
        tax: Number(this.tax),
        shippingCost: Number(this.shippingCost),
        discount: Number(this.discount),
        total: Number(this.total),
      },
      shippingAddress: this.shippingAddress,
      billingAddress: this.billingAddress || undefined,
      shippingMethod: this.shippingMethod,
      paymentMethod: this.paymentMethod || undefined,
      paymentIntentId: this.paymentIntentId || undefined,
      discountCode: this.discountCode || undefined,
      notes: this.notes || undefined,
      metadata: this.metadata || undefined,
      createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : String(this.createdAt),
      updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : String(this.updatedAt),
      confirmedAt: this.confirmedAt instanceof Date ? this.confirmedAt.toISOString() : (this.confirmedAt || undefined),
      shippedAt: this.shippedAt instanceof Date ? this.shippedAt.toISOString() : (this.shippedAt || undefined),
      deliveredAt: this.deliveredAt instanceof Date ? this.deliveredAt.toISOString() : (this.deliveredAt || undefined),
    };
  }
}