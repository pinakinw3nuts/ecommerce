import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Product } from './Product';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 255 })
  slug!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('varchar', { length: 500, nullable: true })
  imageUrl?: string;

  @Column('integer', { default: 0 })
  sortOrder: number = 0;

  @Column('boolean', { default: true })
  isActive: boolean = true;

  @Column('uuid', { nullable: true })
  parentId?: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Category;

  @OneToMany(() => Category, category => category.parent)
  children!: Category[];

  @OneToMany(() => Product, product => product.category)
  products!: Product[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 