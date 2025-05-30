import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Location entity for managing warehouse/storage locations
 */
@Entity('location')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100, unique: true })
  name: string;

  @Column('varchar', { length: 20, unique: true })
  code: string;

  @Column('text', { nullable: true })
  address: string | null;

  @Column('text', { nullable: true })
  city: string | null;

  @Column('text', { nullable: true })
  state: string | null;

  @Column('text', { nullable: true })
  postalCode: string | null;

  @Column('text', { nullable: true })
  country: string | null;

  @Column('text', { nullable: true })
  type: string | null;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 