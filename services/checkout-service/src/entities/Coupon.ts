import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT'
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  @Index()
  code!: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.PERCENTAGE
  })
  type!: CouponType;

  @Column('decimal', { precision: 10, scale: 2 })
  value!: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'int', nullable: true })
  maxUses!: number | null;

  @Column({ type: 'int', default: 0 })
  currentUses!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimumPurchaseAmount!: number | null;

  @Column('simple-array', { nullable: true })
  applicableProducts!: string[] | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Helper method to check if coupon is valid
  isValid(): boolean {
    const now = new Date();
    return (
      this.isActive &&
      (!this.expiresAt || this.expiresAt > now) &&
      (!this.maxUses || this.currentUses < this.maxUses)
    );
  }

  // Helper method to calculate discount amount
  calculateDiscount(subtotal: number): number {
    if (!this.isValid()) return 0;

    if (this.minimumPurchaseAmount && subtotal < this.minimumPurchaseAmount) {
      return 0;
    }

    if (this.type === CouponType.PERCENTAGE) {
      return (subtotal * this.value) / 100;
    }

    return Math.min(this.value, subtotal); // Don't exceed subtotal for fixed amounts
  }
} 