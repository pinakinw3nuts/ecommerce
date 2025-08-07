import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique
} from 'typeorm';

/**
 * Wishlist entity representing a product saved to a user's wishlist
 */
@Entity('wishlists')
@Unique('unique_wishlist_item', ['userId', 'productId', 'variantId'])
export class Wishlist {
  /**
   * Unique identifier for the wishlist entry
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * ID of the user who owns this wishlist entry
   */
  @Column('uuid')
  @Index()
  userId!: string;

  /**
   * ID of the product in the wishlist
   */
  @Column('uuid')
  @Index()
  productId!: string;

  /**
   * Optional ID of the specific product variant
   * Null means the wishlist item refers to the product generally, not a specific variant
   */
  @Column('uuid', { nullable: true })
  variantId?: string | null;

  /**
   * Optional product name at the time it was added to wishlist
   * This helps with displaying the wishlist even if the product is later modified
   */
  @Column({ nullable: true })
  productName?: string;

  /**
   * Optional product image URL at the time it was added to wishlist
   */
  @Column({ nullable: true })
  productImage?: string;

  /**
   * Optional price at the time it was added to wishlist
   */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price?: number;

  /**
   * Optional metadata for additional product information
   * This can store any JSON data related to the product
   */
  @Column('jsonb', { nullable: true, default: {} })
  metadata: Record<string, any> = {};

  /**
   * When the item was added to the wishlist
   */
  @CreateDateColumn()
  @Index()
  createdAt!: Date;

  /**
   * When the wishlist item was last updated
   */
  @UpdateDateColumn()
  updatedAt!: Date;
} 