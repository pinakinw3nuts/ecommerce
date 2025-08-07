import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { Product } from './Product';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 50 })
  code!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('decimal', { precision: 5, scale: 2 })
  discountPercentage!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  discountAmount!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  minimumOrderAmount!: number;

  @Column('integer', { default: 1 })
  maxUses: number = 1;

  @Column('integer', { default: 0 })
  usedCount: number = 0;

  @Column('date')
  startDate!: Date;

  @Column('date')
  endDate!: Date;

  @Column('boolean', { default: true })
  isActive: boolean = true;

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'coupon_products',
    joinColumn: { name: 'couponId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'productId', referencedColumnName: 'id' }
  })
  products!: Product[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 