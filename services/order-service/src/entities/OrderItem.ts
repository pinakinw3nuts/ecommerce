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
import { Order, OrderStatus } from './Order';

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
  
  @Column({ nullable: true })
  name?: string;
  
  @Column({ nullable: true })
  sku?: string;
  
  @Column({ nullable: true })
  image?: string;
  
  @Column('simple-array', { nullable: true })
  additionalImages?: string[];
  
  @Column({ nullable: true })
  variantName?: string;
  
  @Column('text', { nullable: true })
  description?: string;
  
  @Column({
    type: 'varchar',
    nullable: true
  })
  status?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;
  
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice?: number;
  
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salePrice?: number;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number = 0;
  
  @Column('jsonb', { nullable: true })
  brand?: {
    id?: string;
    name?: string;
    logoUrl?: string;
  };
  
  @Column('jsonb', { nullable: true })
  category?: {
    id?: string;
    name?: string;
  };
  
  @Column('jsonb', { nullable: true })
  attributes?: {
    [key: string]: string | number | boolean;
  };
  
  @Column('jsonb', { nullable: true })
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    unit?: string;
  };
  
  @Column({ nullable: true })
  slug?: string;

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
  
  // Get item name from metadata or fallback
  getName(): string {
    return this.name || this.metadata?.name || `Product ${this.productId.substring(0, 8)}`;
  }
  
  // Get item SKU from metadata or fallback
  getSku(): string | undefined {
    return this.sku || this.metadata?.sku;
  }
  
  // Get item image from metadata or fallback
  getImage(): string | undefined {
    return this.image || this.metadata?.image;
  }
  
  // Get additional images or fallback
  getAdditionalImages(): string[] {
    return this.additionalImages || [];
  }
  
  // Get variant name from metadata or fallback
  getVariantName(): string | undefined {
    return this.variantName || this.metadata?.variantName;
  }
} 