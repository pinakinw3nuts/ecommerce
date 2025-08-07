import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ShippingProvider } from './ShippingProvider';
import { ShippingRate } from './ShippingRate';
import { Shipment } from './Shipment';

export enum MethodType {
  EXPRESS = 'express',
  STANDARD = 'standard',
  GROUND = 'ground',
  ECONOMY = 'economy',
  SAME_DAY = 'same_day',
  NEXT_DAY = 'next_day',
  INTERNATIONAL = 'international',
  LOCAL_PICKUP = 'local_pickup',
  FREE = 'free'
}

export enum MethodStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable'
}

@Entity('shipping_methods')
@Index(['name'])
@Index(['type'])
@Index(['providerId'])
@Index(['status'])
export class ShippingMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 100 })
  name!: string;

  @Column('varchar', { length: 50 })
  type!: MethodType;

  @Column('uuid')
  @Index()
  providerId!: string;

  @Column('varchar', { length: 30, default: MethodStatus.ACTIVE })
  status!: MethodStatus;

  @Column('text', { nullable: true })
  description?: string;

  @Column('varchar', { length: 255, nullable: true })
  iconUrl?: string;

  @Column('integer', { default: 1 })
  estimatedDays!: number;

  @Column('boolean', { default: false })
  requiresSignature!: boolean;

  @Column('boolean', { default: false })
  requiresInsurance!: boolean;

  @Column('boolean', { default: false })
  isTrackable!: boolean;

  @Column('boolean', { default: false })
  isInternational!: boolean;

  @Column('boolean', { default: false })
  isLocalPickup!: boolean;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  maxWeight?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  maxDimensions?: {
    length: number;
    width: number;
    height: number;
  };

  @Column('jsonb', { nullable: true })
  restrictions?: {
    countries?: string[];
    excludedCountries?: string[];
    categories?: string[];
    excludedCategories?: string[];
    minOrderValue?: number;
    maxOrderValue?: number;
    [key: string]: any;
  };

  @Column('jsonb', { nullable: true })
  features?: {
    tracking?: boolean;
    insurance?: boolean;
    signature?: boolean;
    deliveryConfirmation?: boolean;
    saturdayDelivery?: boolean;
    sundayDelivery?: boolean;
    [key: string]: any;
  };

  @Column('boolean', { default: true })
  isActive!: boolean;

  @Column('integer', { default: 0 })
  priority!: number;

  @ManyToOne(() => ShippingProvider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider!: ShippingProvider;

  @OneToMany(() => ShippingRate, rate => rate.method)
  rates!: ShippingRate[];

  @OneToMany(() => Shipment, shipment => shipment.method)
  shipments!: Shipment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Helper methods
  isAvailable(): boolean {
    return this.isActive && this.status === MethodStatus.ACTIVE;
  }

  isAvailableForLocation(country: string): boolean {
    if (!this.restrictions) return true;

    if (this.restrictions.excludedCountries?.includes(country)) {
      return false;
    }

    if (this.restrictions.countries && !this.restrictions.countries.includes(country)) {
      return false;
    }

    return true;
  }

  isAvailableForOrder(params: {
    orderValue?: number;
    categories?: string[];
    weight?: number;
    dimensions?: any;
  }): boolean {
    if (!this.restrictions) return true;

    // Check order value restrictions
    if (params.orderValue) {
      if (this.restrictions.minOrderValue && params.orderValue < this.restrictions.minOrderValue) {
        return false;
      }
      if (this.restrictions.maxOrderValue && params.orderValue > this.restrictions.maxOrderValue) {
        return false;
      }
    }

    // Check category restrictions
    if (params.categories) {
      if (this.restrictions.excludedCategories) {
        for (const category of params.categories) {
          if (this.restrictions.excludedCategories.includes(category)) {
            return false;
          }
        }
      }
    }

    // Check weight restrictions
    if (params.weight && this.maxWeight && params.weight > this.maxWeight) {
      return false;
    }

    return true;
  }

  hasFeature(feature: string): boolean {
    return this.features?.[feature] === true;
  }

  getEstimatedDeliveryDate(fromDate: Date = new Date()): Date {
    const deliveryDate = new Date(fromDate);
    deliveryDate.setDate(deliveryDate.getDate() + this.estimatedDays);
    return deliveryDate;
  }

  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      providerId: this.providerId,
      status: this.status,
      description: this.description,
      iconUrl: this.iconUrl,
      estimatedDays: this.estimatedDays,
      requiresSignature: this.requiresSignature,
      requiresInsurance: this.requiresInsurance,
      isTrackable: this.isTrackable,
      isInternational: this.isInternational,
      isLocalPickup: this.isLocalPickup,
      maxWeight: this.maxWeight,
      maxDimensions: this.maxDimensions,
      restrictions: this.restrictions,
      features: this.features,
      isActive: this.isActive,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 