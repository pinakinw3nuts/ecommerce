import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ShippingRate } from './ShippingRate';

export enum ZoneType {
  DOMESTIC = 'domestic',
  INTERNATIONAL = 'international',
  REGIONAL = 'regional',
  CUSTOM = 'custom'
}

@Entity('shipping_zones')
@Index(['name'])
@Index(['type'])
@Index(['country'])
export class ShippingZone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 100 })
  name!: string;

  @Column('varchar', { length: 50 })
  type!: ZoneType;

  @Column('varchar', { length: 2, nullable: true })
  country?: string;

  @Column('varchar', { length: 100, nullable: true })
  state?: string;

  @Column('varchar', { length: 100, nullable: true })
  city?: string;

  @Column('varchar', { length: 20, nullable: true })
  postalCode?: string;

  @Column('jsonb', { nullable: true })
  regions?: string[];

  @Column('jsonb', { nullable: true })
  coordinates?: {
    lat?: number;
    lng?: number;
    radius?: number;
  };

  @Column('text', { nullable: true })
  description?: string;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @Column('integer', { default: 0 })
  priority!: number;

  @Column('jsonb', { nullable: true })
  restrictions?: {
    weight?: {
      min?: number;
      max?: number;
    };
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
    items?: string[];
    [key: string]: any;
  };

  @OneToMany(() => ShippingRate, rate => rate.zone)
  rates!: ShippingRate[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Helper methods
  matchesLocation(location: {
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
  }): boolean {
    if (this.country && this.country !== location.country) {
      return false;
    }
    if (this.state && this.state !== location.state) {
      return false;
    }
    if (this.city && this.city !== location.city) {
      return false;
    }
    if (this.postalCode && this.postalCode !== location.postalCode) {
      return false;
    }
    return true;
  }

  isRestricted(item: any): boolean {
    if (!this.restrictions) return false;

    // Check weight restrictions
    if (this.restrictions.weight) {
      const weight = item.weight || 0;
      if (this.restrictions.weight.min && weight < this.restrictions.weight.min) {
        return true;
      }
      if (this.restrictions.weight.max && weight > this.restrictions.weight.max) {
        return true;
      }
    }

    // Check item restrictions
    if (this.restrictions.items && this.restrictions.items.length > 0) {
      const itemType = item.type || item.category;
      if (this.restrictions.items.includes(itemType)) {
        return true;
      }
    }

    return false;
  }

  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      country: this.country,
      state: this.state,
      city: this.city,
      postalCode: this.postalCode,
      regions: this.regions,
      coordinates: this.coordinates,
      description: this.description,
      isActive: this.isActive,
      priority: this.priority,
      restrictions: this.restrictions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 