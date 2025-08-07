import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ShippingProvider } from './ShippingProvider';
import { ShippingZone } from './ShippingZone';
import { ShippingMethod } from './ShippingMethod';

export enum RateType {
  FLAT = 'flat',
  WEIGHT_BASED = 'weight_based',
  DISTANCE_BASED = 'distance_based',
  TIERED = 'tiered',
  FREE = 'free'
}

@Entity('shipping_rates')
@Index(['providerId', 'zoneId', 'methodId'])
@Index(['rateType'])
@Index(['isActive'])
export class ShippingRate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  providerId!: string;

  @Column('uuid')
  @Index()
  zoneId!: string;

  @Column('uuid')
  @Index()
  methodId!: string;

  @Column('varchar', { length: 50 })
  rateType!: RateType;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  baseRate!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  additionalRate!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  handlingFee!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  insuranceFee!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  signatureFee!: number;

  @Column('jsonb', { nullable: true })
  weightTiers?: {
    min: number;
    max: number;
    rate: number;
  }[];

  @Column('jsonb', { nullable: true })
  distanceTiers?: {
    min: number;
    max: number;
    rate: number;
  }[];

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  minWeight?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  maxWeight?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  minDistance?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  maxDistance?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minOrderValue?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maxOrderValue?: number;

  @Column('integer', { default: 1 })
  estimatedDays!: number;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @Column('integer', { default: 0 })
  priority!: number;

  @Column('jsonb', { nullable: true })
  conditions?: {
    minItems?: number;
    maxItems?: number;
    categories?: string[];
    excludedCategories?: string[];
    [key: string]: any;
  };

  @ManyToOne(() => ShippingProvider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider!: ShippingProvider;

  @ManyToOne(() => ShippingZone, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zoneId' })
  zone!: ShippingZone;

  @ManyToOne(() => ShippingMethod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'methodId' })
  method!: ShippingMethod;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Helper methods
  calculateRate(params: {
    weight?: number;
    distance?: number;
    orderValue?: number;
    itemCount?: number;
    insurance?: boolean;
    signature?: boolean;
  }): number {
    let totalRate = this.baseRate;

    // Add weight-based rate
    if (this.rateType === RateType.WEIGHT_BASED && params.weight) {
      totalRate += this.calculateWeightRate(params.weight);
    }

    // Add distance-based rate
    if (this.rateType === RateType.DISTANCE_BASED && params.distance) {
      totalRate += this.calculateDistanceRate(params.distance);
    }

    // Add tiered rate
    if (this.rateType === RateType.TIERED) {
      totalRate += this.calculateTieredRate(params);
    }

    // Add additional fees
    totalRate += this.handlingFee;

    if (params.insurance) {
      totalRate += this.insuranceFee;
    }

    if (params.signature) {
      totalRate += this.signatureFee;
    }

    return Math.max(0, totalRate);
  }

  private calculateWeightRate(weight: number): number {
    if (!this.weightTiers || this.weightTiers.length === 0) {
      return weight * this.additionalRate;
    }

    for (const tier of this.weightTiers) {
      if (weight >= tier.min && weight <= tier.max) {
        return tier.rate;
      }
    }

    return this.additionalRate * weight;
  }

  private calculateDistanceRate(distance: number): number {
    if (!this.distanceTiers || this.distanceTiers.length === 0) {
      return distance * this.additionalRate;
    }

    for (const tier of this.distanceTiers) {
      if (distance >= tier.min && distance <= tier.max) {
        return tier.rate;
      }
    }

    return this.additionalRate * distance;
  }

  private calculateTieredRate(params: any): number {
    // Complex tiered calculation based on multiple factors
    let rate = 0;

    if (params.orderValue && this.minOrderValue) {
      const valueTier = Math.floor(params.orderValue / this.minOrderValue);
      rate += valueTier * this.additionalRate;
    }

    if (params.itemCount && this.conditions?.minItems) {
      const itemTier = Math.floor(params.itemCount / this.conditions.minItems);
      rate += itemTier * this.additionalRate;
    }

    return rate;
  }

  isApplicable(params: {
    weight?: number;
    distance?: number;
    orderValue?: number;
    itemCount?: number;
    categories?: string[];
  }): boolean {
    // Check weight limits
    if (params.weight) {
      if (this.minWeight && params.weight < this.minWeight) return false;
      if (this.maxWeight && params.weight > this.maxWeight) return false;
    }

    // Check distance limits
    if (params.distance) {
      if (this.minDistance && params.distance < this.minDistance) return false;
      if (this.maxDistance && params.distance > this.maxDistance) return false;
    }

    // Check order value limits
    if (params.orderValue) {
      if (this.minOrderValue && params.orderValue < this.minOrderValue) return false;
      if (this.maxOrderValue && params.orderValue > this.maxOrderValue) return false;
    }

    // Check item count limits
    if (params.itemCount && this.conditions) {
      if (this.conditions.minItems && params.itemCount < this.conditions.minItems) return false;
      if (this.conditions.maxItems && params.itemCount > this.conditions.maxItems) return false;
    }

    // Check category restrictions
    if (params.categories && this.conditions) {
      if (this.conditions.excludedCategories) {
        for (const category of params.categories) {
          if (this.conditions.excludedCategories.includes(category)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  toJSON(): any {
    return {
      id: this.id,
      providerId: this.providerId,
      zoneId: this.zoneId,
      methodId: this.methodId,
      rateType: this.rateType,
      baseRate: this.baseRate,
      additionalRate: this.additionalRate,
      handlingFee: this.handlingFee,
      insuranceFee: this.insuranceFee,
      signatureFee: this.signatureFee,
      weightTiers: this.weightTiers,
      distanceTiers: this.distanceTiers,
      minWeight: this.minWeight,
      maxWeight: this.maxWeight,
      minDistance: this.minDistance,
      maxDistance: this.maxDistance,
      minOrderValue: this.minOrderValue,
      maxOrderValue: this.maxOrderValue,
      estimatedDays: this.estimatedDays,
      isActive: this.isActive,
      priority: this.priority,
      conditions: this.conditions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 