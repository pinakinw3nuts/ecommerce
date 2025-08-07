import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './Product';
import { Inventory } from './Inventory';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  sku!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column('int')
  stock!: number;

  @ManyToOne(() => Product, product => product.variants)
  product!: Product;

  @OneToMany(() => Inventory, inventory => inventory.variant)
  inventory!: Inventory[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 