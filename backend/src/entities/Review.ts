import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User';
import { Product } from './Product';

/**
 * Review entity representing product reviews
 */
@Entity('reviews')
@Unique(['userId', 'productId']) // Ensure one review per user per product
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  userId!: string;

  @Column('uuid')
  @Index()
  productId!: string;

  @Column('integer')
  rating!: number;

  @Column('text', { nullable: true })
  comment?: string;

  @Column('boolean', { default: false })
  isPublished: boolean = false;

  @Column('boolean', { default: false })
  isVerifiedPurchase: boolean = false;

  @Column('jsonb', { nullable: true, default: {} })
  metadata: { [key: string]: any } = {};

  @CreateDateColumn()
  @Index()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  /**
   * Check if the review can be published
   */
  canPublish(): boolean {
    return this.rating >= 1 && this.rating <= 5;
  }

  /**
   * Mark review as published
   */
  publish(): void {
    this.isPublished = true;
  }

  /**
   * Mark review as unpublished
   */
  unpublish(): void {
    this.isPublished = false;
  }

  /**
   * Mark as verified purchase
   */
  markAsVerifiedPurchase(): void {
    this.isVerifiedPurchase = true;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      userId: this.userId,
      productId: this.productId,
      rating: this.rating,
      comment: this.comment,
      isPublished: this.isPublished,
      isVerifiedPurchase: this.isVerifiedPurchase,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 