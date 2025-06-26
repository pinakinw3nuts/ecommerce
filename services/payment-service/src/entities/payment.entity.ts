import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { Refund } from './refund.entity'
import { PaymentMethod } from './payment-method.entity'

// Re-export PaymentMethod
export { PaymentMethod }

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

// Payment method enum
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  RAZORPAY = 'razorpay'
}

export type SupportedPaymentProvider = 'stripe' | 'razorpay' | 'paypal';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  orderId!: string

  @Column({ type: 'uuid' })
  @Index()
  userId!: string

  @Column({
    type: 'enum',
    enum: PaymentProvider
  })
  provider!: PaymentProvider

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  @Index()
  status!: PaymentStatus

  @Column({ type: 'varchar', unique: true, nullable: true })
  transactionId: string | null = null

  @Column({ type: 'varchar' })
  currency!: string

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2
  })
  amount!: number

  @Column({ type: 'varchar', nullable: true })
  providerPaymentId: string | null = null

  @Column({ type: 'jsonb', nullable: true })
  providerResponse: Record<string, any> | null = null

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod!: PaymentMethod

  @Column({ type: 'uuid' })
  paymentMethodId!: string

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null = null

  @OneToMany(() => Refund, refund => refund.payment)
  refunds!: Refund[]

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date

  // Calculated total refunded amount
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0
  })
  refundedAmount: number = 0

  // Helper method to check if payment can be refunded
  canBeRefunded(): boolean {
    return (
      this.status === PaymentStatus.COMPLETED &&
      this.refundedAmount < this.amount &&
      this.provider !== PaymentProvider.PAYPAL
    )
  }

  // Helper method to get remaining refundable amount
  getRefundableAmount(): number {
    return Number(this.amount) - Number(this.refundedAmount)
  }
} 