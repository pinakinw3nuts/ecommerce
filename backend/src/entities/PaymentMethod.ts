import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bank_account',
  DIGITAL_WALLET = 'digital_wallet',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  COD = 'cash_on_delivery',
  SUBSCRIPTION = 'subscription',
  INVOICE = 'invoice',
  BUY_NOW_PAY_LATER = 'buy_now_pay_later',
  CRYPTO = 'cryptocurrency'
}

export enum PaymentMethodStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  EXPIRED = 'expired',
  DECLINED = 'declined'
}

export enum PaymentMethodCategory {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MANUAL = 'manual'
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

  @Column({ name: 'expiry_month', nullable: true })
  expiryMonth?: string;

  @Column({ name: 'expiry_year', nullable: true })
  expiryYear?: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodStatus,
    default: PaymentMethodStatus.ACTIVE
  })
  status!: PaymentMethodStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethodCategory,
    default: PaymentMethodCategory.ONLINE
  })
  category!: PaymentMethodCategory;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @Column({ name: 'requires_manual_verification', default: false })
  requiresManualVerification!: boolean;

  @Column({ name: 'processing_time', nullable: true })
  processingTime?: string;

  @Column({ name: 'payment_instructions', type: 'text', nullable: true })
  paymentInstructions?: string;

  @Column({ name: 'icon_url', nullable: true })
  iconUrl?: string;

  @Column({ name: 'supported_currencies', type: 'jsonb', nullable: true })
  supportedCurrencies?: string[];

  @Column({ name: 'transaction_fee_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  transactionFeePercent?: number;

  @Column({ name: 'transaction_fee_fixed', type: 'decimal', precision: 10, scale: 2, nullable: true })
  transactionFeeFixed?: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
} 