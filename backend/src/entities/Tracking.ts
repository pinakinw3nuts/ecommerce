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
import { Shipment } from './Shipment';

export enum TrackingStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
  EXCEPTION = 'exception'
}

@Entity('tracking')
@Index(['shipmentId'])
@Index(['trackingNumber'])
@Index(['status'])
@Index(['timestamp'])
export class Tracking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  shipmentId!: string;

  @Column('varchar', { length: 100 })
  trackingNumber!: string;

  @Column('varchar', { length: 50 })
  status!: TrackingStatus;

  @Column('varchar', { length: 255 })
  location!: string;

  @Column('text')
  description!: string;

  @Column('timestamp')
  timestamp!: Date;

  @Column('varchar', { length: 100, nullable: true })
  city?: string;

  @Column('varchar', { length: 100, nullable: true })
  state?: string;

  @Column('varchar', { length: 2, nullable: true })
  country?: string;

  @Column('varchar', { length: 20, nullable: true })
  postalCode?: string;

  @Column('jsonb', { nullable: true })
  coordinates?: {
    lat: number;
    lng: number;
  };

  @Column('varchar', { length: 100, nullable: true })
  signedBy?: string;

  @Column('boolean', { default: false })
  isDelivered!: boolean;

  @Column('boolean', { default: false })
  isException!: boolean;

  @Column('jsonb', { nullable: true })
  exceptionDetails?: {
    code?: string;
    reason?: string;
    action?: string;
    [key: string]: any;
  };

  @Column('jsonb', { nullable: true })
  metadata?: {
    providerEventId?: string;
    scanType?: string;
    facility?: string;
    [key: string]: any;
  };

  @ManyToOne(() => Shipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipmentId' })
  shipment!: Shipment;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Helper methods
  isDeliveredEvent(): boolean {
    return this.status === TrackingStatus.DELIVERED;
  }

  isExceptionEvent(): boolean {
    return this.status === TrackingStatus.EXCEPTION || this.isException;
  }

  isInTransitEvent(): boolean {
    return [
      TrackingStatus.IN_TRANSIT,
      TrackingStatus.OUT_FOR_DELIVERY,
      TrackingStatus.PICKED_UP
    ].includes(this.status);
  }

  getFullAddress(): string {
    const parts = [this.location];
    if (this.city) parts.push(this.city);
    if (this.state) parts.push(this.state);
    if (this.postalCode) parts.push(this.postalCode);
    if (this.country) parts.push(this.country);
    return parts.join(', ');
  }

  toJSON(): any {
    return {
      id: this.id,
      shipmentId: this.shipmentId,
      trackingNumber: this.trackingNumber,
      status: this.status,
      location: this.location,
      description: this.description,
      timestamp: this.timestamp,
      city: this.city,
      state: this.state,
      country: this.country,
      postalCode: this.postalCode,
      coordinates: this.coordinates,
      signedBy: this.signedBy,
      isDelivered: this.isDelivered,
      isException: this.isException,
      exceptionDetails: this.exceptionDetails,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 