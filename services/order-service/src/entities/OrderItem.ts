import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Order } from './Order';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  orderId!: string;

  @Column('uuid')
  @Index()
  productId!: string;

  @Column('uuid', { nullable: true })
  @Index()
  variantId: string | null = null;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number = 0;

  @Column('jsonb', { nullable: true })
  metadata: {
    name?: string;
    sku?: string;
    image?: string;
    variantName?: string;
    [key: string]: any;
  } = {};

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  // Relations
  @ManyToOne(() => Order, order => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  // Helper methods
  getSubtotal(): number {
    return this.price * this.quantity - this.discountAmount;
  }
} 