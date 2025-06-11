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
import { Cart } from './Cart';
import { SerializedCartItem } from './Cart';

export interface ProductSnapshot {
  name: string;
  description?: string;
  imageUrl?: string;
  variantName?: string;
  metadata?: Record<string, unknown>;
}

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  cartId!: string;

  @Column('uuid')
  @Index()
  productId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @Column('uuid', { nullable: true })
  variantId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  productSnapshot!: ProductSnapshot;

  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cartId' })
  cart!: Cart;

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
   * Update item quantity
   */
  updateQuantity(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    this.quantity = quantity;
  }

  /**
   * Convert item to JSON for response
   */
  toJSON(): SerializedCartItem {
    // Ensure price is properly converted to a number
    const price = typeof this.price === 'string' ? Number(this.price) : 
                  typeof this.price === 'number' ? this.price : 0;
    
    return {
      id: this.id,
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