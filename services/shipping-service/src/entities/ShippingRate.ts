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
import { formatDateColumn } from '../utils/date-formatter';

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

  /**
   * Custom toJSON method to handle serialization and avoid circular references
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      rate: this.rate,
      shippingMethodId: this.shippingMethodId,
      shippingZoneId: this.shippingZoneId,
      minWeight: this.minWeight,
      maxWeight: this.maxWeight,
      minOrderValue: this.minOrderValue,
      maxOrderValue: this.maxOrderValue,
      estimatedDays: this.estimatedDays,
      conditions: this.conditions,
      isActive: this.isActive,
      createdAt: formatDateColumn(this.createdAt),
      updatedAt: formatDateColumn(this.updatedAt),
      // Include basic info from relations but avoid circular references
      shippingMethod: this.shippingMethod ? {
        id: this.shippingMethod.id,
        name: this.shippingMethod.name,
        code: this.shippingMethod.code
      } : null,
      shippingZone: this.shippingZone ? {
        id: this.shippingZone.id,
        name: this.shippingZone.name,
        code: this.shippingZone.code
      } : null
    };
  }
} 