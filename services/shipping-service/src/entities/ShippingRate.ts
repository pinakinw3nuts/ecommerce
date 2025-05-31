import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { ShippingMethod } from './ShippingMethod';
import { ShippingZone } from './ShippingZone';

/**
 * Interface for shipping rate conditions
 */
interface RateConditions {
  productCategories?: string[];
  customerGroups?: string[];
  weekdays?: number[];
  timeRanges?: { start: string; end: string }[];
  orderItems?: number;
  specialDates?: string[];
}

/**
 * ShippingRate entity for storing shipping pricing based on methods, zones and conditions
 */
@Entity('shipping_rates')
export class ShippingRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rate: number;

  @Column({ nullable: true })
  shippingMethodId: string;

  @ManyToOne(() => ShippingMethod, method => method.rates)
  @JoinColumn({ name: 'shipping_method_id' })
  shippingMethod: ShippingMethod;

  @Column({ nullable: true })
  shippingZoneId: string;

  @ManyToOne(() => ShippingZone, zone => zone.rates)
  @JoinColumn({ name: 'shipping_zone_id' })
  shippingZone: ShippingZone;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minWeight: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxWeight: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderValue: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxOrderValue: number | null;

  @Column({ name: 'estimated_days', default: 3 })
  estimatedDays: number;

  @Column({ type: 'jsonb', nullable: true })
  conditions: {
    productCategories?: string[];
    customerGroups?: string[];
    weekdays?: number[];
    timeRanges?: Array<{ start: string; end: string }>;
  } | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 