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
import { ShippingRate } from './ShippingRate';
import { ShippingMethod } from './ShippingMethod';
import { formatDateColumn } from '../utils/date-formatter';

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

  @ManyToMany(() => ShippingMethod)
  @JoinTable({
    name: 'shipping_method_zones',
    joinColumn: { name: 'shipping_zone_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'shipping_method_id', referencedColumnName: 'id' }
  })
  methods: ShippingMethod[];

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
      code: this.code,
      description: this.description,
      countries: this.countries,
      regions: this.regions,
      pincodePatterns: this.pincodePatterns,
      pincodeRanges: this.pincodeRanges,
      excludedPincodes: this.excludedPincodes,
      isActive: this.isActive,
      priority: this.priority,
      createdAt: formatDateColumn(this.createdAt),
      updatedAt: formatDateColumn(this.updatedAt)
    };
  }
} 