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

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  productId!: string;

  @Column('varchar', { length: 255 })
  title!: string;

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  discountPercentage!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  discountAmount!: number;

  @Column('date')
  startDate!: Date;

  @Column('date')
  endDate!: Date;

  @Column('boolean', { default: true })
  isActive: boolean = true;

  @Column('integer', { default: 0 })
  maxUses: number = 0;

  @Column('integer', { default: 0 })
  usedCount: number = 0;

  @Column('jsonb', { nullable: true })
  conditions?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: Product;
} 