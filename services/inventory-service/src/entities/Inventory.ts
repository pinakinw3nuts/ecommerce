import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  Check
} from 'typeorm';

/**
 * Inventory entity representing stock levels for products and variants
 */
@Entity('inventory')
@Unique(['sku', 'location']) // Composite unique constraint on SKU + location
@Index(['productId']) // Index for faster lookups by product ID
@Index(['variantId']) // Index for faster lookups by variant ID
@Index(['sku']) // Index for faster lookups by SKU
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column('uuid', { nullable: true })
  variantId: string | null;

  @Column({ length: 20 })
  sku: string;

  @Column('integer')
  stock: number;

  @Column({ length: 100 })
  location: string;

  @Column('integer', { default: 5 })
  @Check('threshold >= 0') // Ensure threshold is never negative
  threshold: number;

  @Column('boolean', { default: false })
  isLowStock: boolean;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('timestamp', { nullable: true })
  lastRestockedAt: Date | null;

  @Column('timestamp', { nullable: true })
  lastCountedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 