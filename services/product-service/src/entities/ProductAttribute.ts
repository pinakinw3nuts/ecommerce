import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AttributeValue } from './AttributeValue';

@Entity()
export class ProductAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  type: 'select' | 'multiple' | 'text' | 'number' | 'boolean';

  @Column({ default: true })
  isFilterable: boolean;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => AttributeValue, value => value.attribute)
  values: AttributeValue[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 