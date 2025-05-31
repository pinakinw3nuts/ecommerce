import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToMany
} from 'typeorm';
import { ShippingRate } from './ShippingRate';
import { ShippingMethod } from './ShippingMethod';

/**
 * ShippingZone entity for storing geographical shipping regions
 */
@Entity('shipping_zones')
export class ShippingZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  @Index()
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('simple-array')
  countries: string[];

  @Column('jsonb', { nullable: true })
  regions: Array<{ country: string; state?: string; city?: string; pincode?: string }>;

  @Column('text', { array: true, nullable: true })
  pincodePatterns: string[];

  @Column('text', { array: true, nullable: true })
  pincodeRanges: string[];

  @Column('text', { array: true, nullable: true })
  excludedPincodes: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @OneToMany(() => ShippingRate, rate => rate.shippingZone)
  rates: ShippingRate[];

  @ManyToMany(() => ShippingMethod, method => method.zones)
  methods: ShippingMethod[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 