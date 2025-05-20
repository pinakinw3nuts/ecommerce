import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'
import { Payment } from './payment.entity'

// Refund status enum
export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  paymentId!: string

  @ManyToOne(() => Payment, payment => payment.refunds)
  @JoinColumn({ name: 'paymentId' })
  payment!: Payment

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2
  })
  amount!: number

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING
  })
  @Index()
  status: RefundStatus = RefundStatus.PENDING

  @Column({ type: 'text' })
  reason!: string

  @Column({ type: 'uuid' })
  @Index()
  requestedBy!: string

  @Column({ type: 'varchar', unique: true, nullable: true })
  transactionId: string | null = null

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null = null

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date

  // Helper method to check if refund can be processed
  canBeProcessed(): boolean {
    return this.status === RefundStatus.PENDING
  }

  // Helper method to mark refund as completed
  markAsCompleted(transactionId: string): void {
    this.status = RefundStatus.COMPLETED
    this.transactionId = transactionId
  }

  // Helper method to mark refund as failed
  markAsFailed(): void {
    this.status = RefundStatus.FAILED
  }
} 