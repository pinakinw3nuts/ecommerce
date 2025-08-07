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

export interface ProductSnapshot {
  name: string;
  description?: string;
  imageUrl?: string;
  additionalImages?: string[];
  variantName?: string;
  sku?: string;
  brand?: {
    id?: string;
    name?: string;
    logoUrl?: string;
  };
  category?: {
    id?: string;
    name?: string;
  };
  attributes?: {
    [key: string]: string | number | boolean;
  };
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    unit?: string;
  };
  originalPrice?: number;
  salePrice?: number;
  slug?: string;
  metadata?: Record<string, unknown>;
}

export interface OrderItemJSON {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  total: number;
  productSnapshot: ProductSnapshot;
  createdAt: string;
  updatedAt: string;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  orderId!: string;

  @Column('uuid')
  @Index()
  productId!: string;

  @Column('uuid', { nullable: true })
  variantId!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'jsonb' })
  productSnapshot!: ProductSnapshot;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Calculate item total
   */
  getTotal(): number {
    const numericPrice = typeof this.price === 'string' ? Number(this.price) : this.price;
    return this.quantity * numericPrice;
  }

  /**
   * Get display name for the item
   */
  getDisplayName(): string {
    const productName = this.productSnapshot.name || 'Unknown Product';
    const variantName = this.productSnapshot.variantName;
    
    return variantName ? `${productName} - ${variantName}` : productName;
  }

  /**
   * Check if item can be returned/refunded
   */
  canBeReturned(): boolean {
    // Add business logic for return eligibility
    // For now, assume all items can be returned within a certain timeframe
    return true;
  }

  /**
   * Convert item to JSON for response
   */
  toJSON(): OrderItemJSON {
    const price = typeof this.price === 'string' ? Number(this.price) : 
                  typeof this.price === 'number' ? this.price : 0;
    
    return {
      id: this.id,
      orderId: this.orderId,
      productId: this.productId,
      variantId: this.variantId,
      quantity: this.quantity,
      price: price,
      total: this.quantity * price,
      productSnapshot: this.productSnapshot || {
        name: 'Unknown Product'
      },
      createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : String(this.createdAt),
      updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : String(this.updatedAt),
    };
  }
}