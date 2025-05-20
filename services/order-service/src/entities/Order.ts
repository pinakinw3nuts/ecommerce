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

  @Column('jsonb')
  shippingAddress!: Address;

  @Column('jsonb', { nullable: true })
  billingAddress!: Address;

  @Column({ nullable: true })
  trackingNumber?: string;

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

  // Helper methods
  calculateTotalAmount(): number {
    const itemsTotal = this.items?.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0) ?? 0;
    
    return itemsTotal + this.shippingAmount + this.taxAmount - this.discountAmount;
  }

  updateTotalAmount(): void {
    this.totalAmount = this.calculateTotalAmount();
  }
} 