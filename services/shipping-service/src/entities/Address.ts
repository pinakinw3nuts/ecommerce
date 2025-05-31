import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check
} from 'typeorm';

/**
 * Address types
 */
export enum AddressType {
  SHIPPING = 'shipping',
  BILLING = 'billing',
  BOTH = 'both'
}

/**
 * Address entity for storing user shipping and billing addresses
 */
@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ length: 100 })
  fullName: string;

  @Column({ length: 255 })
  addressLine1: string;

  @Column({ length: 255, nullable: true })
  addressLine2: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  state: string;

  @Column({ length: 100 })
  country: string;

  @Column({ length: 20 })
  pincode: string;

  @Column({ length: 20 })
  phone: string;

  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.SHIPPING
  })
  type: AddressType;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 