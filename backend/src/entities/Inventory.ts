import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  Check,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Product } from './Product';
import { ProductVariant } from './ProductVariant';
import { InventoryMovement } from './InventoryMovement';

/**
 * Inventory entity representing stock levels for products and variants
 */
@Entity('inventory')
@Unique(['sku', 'location']) // Composite unique constraint on SKU + location
@Index(['productId']) // Index for faster lookups by product ID
@Index(['variantId']) // Index for faster lookups by variant ID
@Index(['sku']) // Index for faster lookups by SKU
@Index(['location']) // Index for faster lookups by location
@Index(['isLowStock']) // Index for low stock alerts
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  productId!: string;

  @Column('uuid', { nullable: true })
  variantId?: string | null;

  @Column({ length: 20 })
  sku!: string;

  @Column('integer')
  stock!: number;

  @Column({ length: 100 })
  location!: string;

  @Column('integer', { default: 5 })
  @Check('threshold >= 0') // Ensure threshold is never negative
  threshold!: number;

  @Column('boolean', { default: false })
  isLowStock!: boolean;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('timestamp', { nullable: true })
  lastRestockedAt?: Date | null;

  @Column('timestamp', { nullable: true })
  lastCountedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Product, product => product.inventory)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @ManyToOne(() => ProductVariant, variant => variant.inventory)
  @JoinColumn({ name: 'variantId' })
  variant?: ProductVariant;

  @OneToMany(() => InventoryMovement, movement => movement.inventory)
  movements!: InventoryMovement[];

  /**
   * Check if inventory is low stock
   */
  checkLowStock(): boolean {
    this.isLowStock = this.stock <= this.threshold;
    return this.isLowStock;
  }

  /**
   * Update stock level
   */
  updateStock(newStock: number): void {
    this.stock = newStock;
    this.checkLowStock();
    
    if (newStock > this.stock) {
      this.lastRestockedAt = new Date();
    }
  }

  /**
   * Check if there's sufficient stock
   */
  hasSufficientStock(quantity: number): boolean {
    return this.stock >= quantity;
  }

  /**
   * Reserve stock (decrease available stock)
   */
  reserveStock(quantity: number): boolean {
    if (!this.hasSufficientStock(quantity)) {
      return false;
    }
    
    this.stock -= quantity;
    this.checkLowStock();
    return true;
  }

  /**
   * Release reserved stock (increase available stock)
   */
  releaseStock(quantity: number): void {
    this.stock += quantity;
    this.checkLowStock();
  }

  /**
   * Convert to JSON for response
   */
  toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      variantId: this.variantId,
      sku: this.sku,
      stock: this.stock,
      location: this.location,
      threshold: this.threshold,
      isLowStock: this.isLowStock,
      isActive: this.isActive,
      metadata: this.metadata,
      lastRestockedAt: this.lastRestockedAt?.toISOString(),
      lastCountedAt: this.lastCountedAt?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
} 