import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Product } from './Product';

@Entity('product_reviews')
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  productId!: string;

  @Column('varchar', { length: 255 })
  title!: string;

  @Column('text')
  content!: string;

  @Column('integer')
  rating!: number;

  @Column('varchar', { length: 255 })
  reviewerName!: string;

  @Column('varchar', { length: 255 })
  reviewerEmail!: string;

  @Column('boolean', { default: false })
  isVerified: boolean = false;

  @Column('boolean', { default: true })
  isPublished: boolean = true;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 