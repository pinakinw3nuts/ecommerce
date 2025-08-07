import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ShippingMethod } from './ShippingMethod';
import { Shipment } from './Shipment';

export enum ProviderType {
  FEDEX = 'fedex',
  UPS = 'ups',
  DHL = 'dhl',
  USPS = 'usps',
  CUSTOM = 'custom'
}

export enum ProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance'
}

@Entity('shipping_providers')
@Index(['name'])
@Index(['type'])
@Index(['status'])
export class ShippingProvider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 100 })
  name!: string;

  @Column('varchar', { length: 50 })
  type!: ProviderType;

  @Column('varchar', { length: 20, default: ProviderStatus.ACTIVE })
  status!: ProviderStatus;

  @Column('text', { nullable: true })
  description?: string;

  @Column('varchar', { length: 255, nullable: true })
  logoUrl?: string;

  @Column('varchar', { length: 255, nullable: true })
  website?: string;

  @Column('jsonb', { nullable: true })
  credentials?: {
    apiKey?: string;
    apiSecret?: string;
    accountNumber?: string;
    [key: string]: any;
  };

  @Column('jsonb', { nullable: true })
  settings?: {
    testMode?: boolean;
    defaultService?: string;
    pickupLocation?: string;
    [key: string]: any;
  };

  @Column('jsonb', { nullable: true })
  capabilities?: {
    domestic?: boolean;
    international?: boolean;
    express?: boolean;
    ground?: boolean;
    tracking?: boolean;
    insurance?: boolean;
    signature?: boolean;
    [key: string]: any;
  };

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  baseRate!: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  handlingFee!: number;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @Column('integer', { default: 0 })
  priority!: number;

  @OneToMany(() => ShippingMethod, method => method.provider)
  methods!: ShippingMethod[];

  @OneToMany(() => Shipment, shipment => shipment.provider)
  shipments!: Shipment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Helper methods
  isAvailable(): boolean {
    return this.isActive && this.status === ProviderStatus.ACTIVE;
  }

  hasCapability(capability: string): boolean {
    return this.capabilities?.[capability] === true;
  }

  getTotalRate(): number {
    return this.baseRate + this.handlingFee;
  }

  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      description: this.description,
      logoUrl: this.logoUrl,
      website: this.website,
      capabilities: this.capabilities,
      baseRate: this.baseRate,
      handlingFee: this.handlingFee,
      isActive: this.isActive,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 