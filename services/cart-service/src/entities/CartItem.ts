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
  productSnapshot!: {
    name: string;
    description?: string;
    imageUrl?: string;
    variantName?: string;
    metadata?: Record<string, unknown>;
  };

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
    return this.quantity * Number(this.price);
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
  toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      variantId: this.variantId,
      quantity: this.quantity,
      price: this.price,
      total: this.getTotal(),
      productSnapshot: this.productSnapshot,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
} 