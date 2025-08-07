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
import { User } from './User';

export enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  BILLING = 'BILLING',
  SHIPPING = 'SHIPPING',
  OTHER = 'OTHER'
}

export interface AddressJSON {
  id: string;
  userId: string;
  type: AddressType;
  firstName: string;
  lastName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  instructions?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  userId!: string;

  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.HOME
  })
  type!: AddressType;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  street!: string;

  @Column({ nullable: true })
  apartment?: string;

  @Column()
  city!: string;

  @Column()
  state!: string;

  @Column()
  country!: string;

  @Column()
  postalCode!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ default: false })
  isDefault!: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Get full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Get formatted address
   */
  getFormattedAddress(): string {
    const parts = [
      this.street,
      this.apartment,
      this.city,
      this.state,
      this.postalCode,
      this.country
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Check if address is complete
   */
  isComplete(): boolean {
    return !!(
      this.firstName &&
      this.lastName &&
      this.street &&
      this.city &&
      this.state &&
      this.postalCode &&
      this.country
    );
  }

  /**
   * Convert to shipping address format
   */
  toShippingAddress() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      street: this.street,
      apartment: this.apartment,
      city: this.city,
      state: this.state,
      zipCode: this.postalCode,
      country: this.country,
      phone: this.phone,
    };
  }

  /**
   * Convert to JSON for response
   */
  toJSON(): AddressJSON {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      firstName: this.firstName,
      lastName: this.lastName,
      street: this.street,
      apartment: this.apartment,
      city: this.city,
      state: this.state,
      country: this.country,
      postalCode: this.postalCode,
      phone: this.phone,
      instructions: this.instructions,
      isDefault: this.isDefault,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}