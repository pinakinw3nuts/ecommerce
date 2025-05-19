import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Product } from './Product';

@Entity()
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @Column('text')
  comment: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ default: false })
  isVerifiedPurchase: boolean;

  @Column({ type: 'int', default: 0 })
  helpfulCount: number;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    platform?: string;
    deviceType?: string;
    purchaseDate?: string;
  };

  @ManyToOne(() => Product, product => product.reviews, { onDelete: 'CASCADE' })
  product: Product;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 