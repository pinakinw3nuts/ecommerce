import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentGatewayType {
  DIRECT = 'direct',
  REDIRECT = 'redirect',
  IFRAME = 'iframe',
  OFFLINE = 'offline'
}

@Entity('payment_gateways')
export class PaymentGateway {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PaymentGatewayType,
    default: PaymentGatewayType.DIRECT
  })
  type!: PaymentGatewayType;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ name: 'display_order', default: 0 })
  displayOrder!: number;

  @Column({ name: 'icon_url', nullable: true })
  iconUrl?: string;

  @Column({ name: 'redirect_url', nullable: true })
  redirectUrl?: string;

  @Column({ name: 'webhook_url', nullable: true })
  webhookUrl?: string;

  @Column({ name: 'supports_refunds', default: false })
  supportsRefunds!: boolean;

  @Column({ name: 'supports_subscriptions', default: false })
  supportsSubscriptions!: boolean;

  @Column({ name: 'supports_saved_cards', default: false })
  supportsSavedCards!: boolean;

  @Column({ name: 'min_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minAmount?: number;

  @Column({ name: 'max_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxAmount?: number;

  @Column({ name: 'transaction_fee_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  transactionFeePercent!: number;

  @Column({ name: 'transaction_fee_fixed', type: 'decimal', precision: 10, scale: 2, default: 0 })
  transactionFeeFixed!: number;

  @Column({ name: 'supported_countries', type: 'jsonb', default: [] })
  supportedCountries!: string[];

  @Column({ name: 'excluded_countries', type: 'jsonb', default: [] })
  excludedCountries!: string[];

  @Column({ name: 'supported_currencies', type: 'jsonb', default: [] })
  supportedCurrencies!: string[];

  @Column({ name: 'default_order_status', default: 'pending' })
  defaultOrderStatus!: string;

  @Column({ name: 'payment_instructions', type: 'text', nullable: true })
  paymentInstructions?: string;

  @Column({ name: 'checkout_fields', type: 'jsonb', default: [] })
  checkoutFields!: Record<string, any>[];

  @Column({ name: 'api_credentials', type: 'jsonb', default: {} })
  apiCredentials!: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
} 