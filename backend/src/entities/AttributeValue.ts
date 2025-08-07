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

@Entity('attribute_values')
export class AttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 255 })
  value!: string;

  @Column('varchar', { length: 100 })
  type!: string;

  @Column('boolean', { default: true })
  isActive: boolean = true;

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'product_attribute_values',
    joinColumn: { name: 'attributeValueId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'productId', referencedColumnName: 'id' }
  })
  products!: Product[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 