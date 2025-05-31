import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { ShippingZone } from './ShippingZone';
import { ShippingRate } from './ShippingRate';

/**
 * ShippingMethod entity for storing shipping method options
 */
@Entity('shipping_methods')
export class ShippingMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseRate: number;

  @Column({ type: 'int', default: 3 })
  estimatedDays: number;

  @Column({ length: 255, nullable: true })
  icon: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @ManyToMany(() => ShippingZone)
  @JoinTable({
    name: 'shipping_method_zones',
    joinColumn: { name: 'shipping_method_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'shipping_zone_id', referencedColumnName: 'id' }
  })
  zones: ShippingZone[];

  @OneToMany(() => ShippingRate, rate => rate.shippingMethod)
  rates: ShippingRate[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 