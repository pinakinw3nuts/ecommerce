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
} 