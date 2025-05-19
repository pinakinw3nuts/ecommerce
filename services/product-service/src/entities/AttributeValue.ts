import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany } from 'typeorm';
import { ProductAttribute } from './ProductAttribute';
import { Product } from './Product';

@Entity()
export class AttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: string;

  @Column({ nullable: true })
  displayValue: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    hexColor?: string;
    imageUrl?: string;
    sortOrder?: number;
  };

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => ProductAttribute, attribute => attribute.values)
  attribute: ProductAttribute;

  @ManyToMany(() => Product, product => product.attributes)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 