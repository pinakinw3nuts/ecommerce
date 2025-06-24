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
import { OrderNote } from './OrderNote';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  
  @Column({ nullable: true, unique: true })
  @Index()
  orderNumber: string = '';

  @Column('uuid')
  @Index()
  userId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  @Index()
  status!: OrderStatus;
  
  @Column({
    type: 'varchar',
    nullable: true,
    default: 'PENDING'
  })
  paymentStatus: string | null = null;
  
  @Column({
    type: 'varchar',
    nullable: true,
    default: null
  })
  paymentMethod: string | null = null;

  @Column('jsonb')
  shippingAddress!: Address;

  @Column('jsonb', { nullable: true })
  billingAddress!: Address;

  @Column({ nullable: true })
  trackingNumber?: string;
  
  @Column({ nullable: true })
  shippingCarrier?: string;
  
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  subtotal?: number;

  @Column('jsonb', { nullable: true, default: {} })
  metadata: { [key: string]: string | number | boolean | null } = {};

  @CreateDateColumn()
  @Index()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  // Relations
  @OneToMany(() => OrderItem, item => item.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItem[];

  @OneToMany(() => OrderNote, note => note.order)
  notes!: OrderNote[];

  // Calculated fields
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxAmount: number = 0;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingAmount: number = 0;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number = 0;

  // Customer information fields
  @Column({ nullable: true })
  customerName?: string;
  
  @Column({ nullable: true })
  customerEmail?: string;
  
  @Column({ nullable: true })
  customerPhone?: string;

  // Helper methods
  calculateTotalAmount(): number {
    const itemsTotal = this.items?.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0) ?? 0;
    
    return itemsTotal + this.shippingAmount + this.taxAmount - this.discountAmount;
  }

  updateTotalAmount(): void {
    this.totalAmount = this.calculateTotalAmount();
  }
  
  calculateSubtotal(): number {
    return this.items?.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0) ?? 0;
  }
  
  updateSubtotal(): void {
    this.subtotal = this.calculateSubtotal();
  }
  
  // Generate a unique order number based on timestamp and random values
  generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
    return this.orderNumber;
  }
} 