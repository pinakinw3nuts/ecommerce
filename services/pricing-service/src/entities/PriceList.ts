import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { ProductPrice } from './ProductPrice';
import { CustomerGroup } from './CustomerGroup';

@Entity()
@Index(['name', 'currency'])
@Index(['customerGroupId', 'active'])
export class PriceList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  @Index()
  currency: string;

  @Column({ nullable: true })
  @Index()
  customerGroupId: string;

  @ManyToOne(() => CustomerGroup, customerGroup => customerGroup.priceLists)
  @JoinColumn({ name: 'customerGroupId' })
  customerGroup: CustomerGroup;

  @Column({ default: true })
  @Index()
  active: boolean;

  @Column({ default: 0 })
  priority: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @OneToMany(() => ProductPrice, productPrice => productPrice.priceList, {
    cascade: true
  })
  productPrices: ProductPrice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 