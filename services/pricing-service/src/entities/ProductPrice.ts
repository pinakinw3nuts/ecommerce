import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique
} from 'typeorm';
import { PriceList } from './PriceList';

/**
 * Interface for tiered pricing
 */
export interface TieredPrice {
  /** Minimum quantity for this tier */
  quantity: number;
  /** Price for this tier */
  price: number;
  /** Optional tier name */
  name?: string;
}

@Entity()
@Unique(['priceListId', 'productId', 'variantId'])
@Index(['productId', 'variantId'])
export class ProductPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  priceListId: string;

  @ManyToOne(() => PriceList, priceList => priceList.productPrices, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'priceListId' })
  priceList: PriceList;

  @Column()
  @Index()
  productId: string;

  @Column({ nullable: true })
  @Index()
  variantId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ type: 'timestamp', nullable: true })
  saleStartDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  saleEndDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  tieredPrices: TieredPrice[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxPrice: number;

  @Column({ default: true })
  @Index()
  active: boolean;

  @Column({ nullable: true })
  externalReference: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Get the effective price based on quantity
   */
  getEffectivePrice(quantity: number = 1): number {
    // Check if there's a valid sale price
    const now = new Date();
    const isSaleActive = 
      this.salePrice !== null && 
      this.salePrice !== undefined &&
      (!this.saleStartDate || this.saleStartDate <= now) &&
      (!this.saleEndDate || this.saleEndDate >= now);

    // Base price is sale price if active, otherwise regular price
    let effectivePrice = isSaleActive ? this.salePrice! : this.basePrice;
    
    // If no tiered pricing or quantity is 1, return the base/sale price
    if (!this.tieredPrices || !Array.isArray(this.tieredPrices) || quantity === 1) {
      return effectivePrice;
    }
    
    // Find the applicable tier based on quantity
    const applicableTiers = this.tieredPrices
      .filter(tier => tier.quantity <= quantity)
      .sort((a, b) => b.quantity - a.quantity);
    
    // Return the price from the highest applicable tier, or the base price if no tiers apply
    return applicableTiers.length > 0 ? applicableTiers[0].price : effectivePrice;
  }
} 