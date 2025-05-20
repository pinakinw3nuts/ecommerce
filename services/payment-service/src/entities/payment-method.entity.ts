import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bank_account'
}

export enum PaymentMethodStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodType
  })
  type!: PaymentMethodType;

  @Column()
  provider!: string;

  @Column({ name: 'provider_method_id' })
  providerMethodId!: string;

  @Column()
  last4!: string;

  @Column({ name: 'expiry_month' })
  expiryMonth!: string;

  @Column({ name: 'expiry_year' })
  expiryYear!: string;

  @Column()
  brand!: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodStatus,
    default: PaymentMethodStatus.ACTIVE
  })
  status!: PaymentMethodStatus;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
} 