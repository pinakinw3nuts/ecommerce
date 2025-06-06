import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  BILLING = 'BILLING',
  SHIPPING = 'SHIPPING',
  OTHER = 'OTHER'
}

@Entity('addresses', { synchronize: false })
export class Address extends BaseEntity {
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

  @Column({ name: 'postal_code' })
  postalCode!: string;

  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.HOME,
    enumName: 'address_type_enum'
  })
  type!: AddressType;

  @Column({ default: false })
  isDefault!: boolean;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  instructions?: string;

  @ManyToOne(() => User, user => user.addresses)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;
} 