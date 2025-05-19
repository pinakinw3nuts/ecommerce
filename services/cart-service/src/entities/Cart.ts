import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CartItem } from './CartItem';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { nullable: true })
  @Index()
  userId!: string | null;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total!: number;

  @Column('integer', { default: 0 })
  itemCount!: number;

  @Column('boolean', { default: false })
  isCheckedOut!: boolean;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any> | null;

  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: true,
  })
  items!: CartItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column('timestamp', { nullable: true })
  expiresAt!: Date | null;

  /**
   * Calculate cart totals
   */
  calculateTotals(): void {
    this.total = this.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.price),
      0
    );
    this.itemCount = this.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }

  /**
   * Check if cart is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Check if cart belongs to user
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Convert cart to JSON for response
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      total: this.total,
      itemCount: this.itemCount,
      items: this.items,
      isCheckedOut: this.isCheckedOut,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      expiresAt: this.expiresAt,
    };
  }
} 