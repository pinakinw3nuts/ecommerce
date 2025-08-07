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
import { Order } from './Order';
import { ShippingProvider } from './ShippingProvider';
import { ShippingMethod } from './ShippingMethod';
import { Tracking } from './Tracking';

export enum ShipmentStatus {
  PENDING = 'pending',
  LABEL_CREATED = 'label_created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled'
}

export enum ShipmentType {
  OUTBOUND = 'outbound',
  RETURN = 'return',
  EXCHANGE = 'exchange'
}

@Entity('shipments')
@Index(['orderId'])
@Index(['trackingNumber'])
@Index(['status'])
@Index(['providerId'])
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  orderId!: string;

  @Column('uuid')
  @Index()
  providerId!: string;

  @Column('uuid')
  @Index()
  methodId!: string;

  @Column('varchar', { length: 100, nullable: true })
  trackingNumber?: string;

  @Column('varchar', { length: 50, default: ShipmentStatus.PENDING })
  status!: ShipmentStatus;

  @Column('varchar', { length: 50, default: ShipmentType.OUTBOUND })
  type!: ShipmentType;

  @Column('decimal', { precision: 10, scale: 2 })
  cost!: number;

  @Column('decimal', { precision: 8, scale: 2 })
  weight!: number;

  @Column('jsonb', { nullable: true })
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };

  @Column('jsonb')
  origin!: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };

  @Column('jsonb')
  destination!: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };

  @Column('varchar', { length: 255, nullable: true })
  labelUrl?: string;

  @Column('varchar', { length: 255, nullable: true })
  returnLabelUrl?: string;

  @Column('timestamp', { nullable: true })
  shippedAt?: Date;

  @Column('timestamp', { nullable: true })
  deliveredAt?: Date;

  @Column('timestamp', { nullable: true })
  estimatedDeliveryAt?: Date;

  @Column('boolean', { default: false })
  requiresSignature!: boolean;

  @Column('boolean', { default: false })
  hasInsurance!: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  insuranceAmount?: number;

  @Column('jsonb', { nullable: true })
  packages?: {
    id: string;
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    items: {
      productId: string;
      quantity: number;
      sku?: string;
    }[];
  }[];

  @Column('jsonb', { nullable: true })
  metadata?: {
    providerReference?: string;
    serviceLevel?: string;
    specialInstructions?: string;
    [key: string]: any;
  };

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @ManyToOne(() => ShippingProvider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider!: ShippingProvider;

  @ManyToOne(() => ShippingMethod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'methodId' })
  method!: ShippingMethod;

  @OneToMany(() => Tracking, tracking => tracking.shipment)
  tracking!: Tracking[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Helper methods
  isDelivered(): boolean {
    return this.status === ShipmentStatus.DELIVERED;
  }

  isInTransit(): boolean {
    return [
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.PICKED_UP
    ].includes(this.status);
  }

  isFailed(): boolean {
    return [
      ShipmentStatus.FAILED,
      ShipmentStatus.RETURNED,
      ShipmentStatus.CANCELLED
    ].includes(this.status);
  }

  canTrack(): boolean {
    return !!this.trackingNumber && this.method.isTrackable;
  }

  getLatestTracking(): Tracking | null {
    if (!this.tracking || this.tracking.length === 0) {
      return null;
    }
    return this.tracking.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }

  updateStatus(status: ShipmentStatus): void {
    this.status = status;
    
    if (status === ShipmentStatus.PICKED_UP && !this.shippedAt) {
      this.shippedAt = new Date();
    }
    
    if (status === ShipmentStatus.DELIVERED && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
  }

  calculateTotalWeight(): number {
    if (this.packages && this.packages.length > 0) {
      return this.packages.reduce((total, pkg) => total + pkg.weight, 0);
    }
    return this.weight;
  }

  toJSON(): any {
    return {
      id: this.id,
      orderId: this.orderId,
      providerId: this.providerId,
      methodId: this.methodId,
      trackingNumber: this.trackingNumber,
      status: this.status,
      type: this.type,
      cost: this.cost,
      weight: this.weight,
      dimensions: this.dimensions,
      origin: this.origin,
      destination: this.destination,
      labelUrl: this.labelUrl,
      returnLabelUrl: this.returnLabelUrl,
      shippedAt: this.shippedAt,
      deliveredAt: this.deliveredAt,
      estimatedDeliveryAt: this.estimatedDeliveryAt,
      requiresSignature: this.requiresSignature,
      hasInsurance: this.hasInsurance,
      insuranceAmount: this.insuranceAmount,
      packages: this.packages,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 