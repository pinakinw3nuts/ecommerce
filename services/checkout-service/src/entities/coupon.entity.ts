import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column('decimal')
  discount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  expiresAt?: Date;

  // Helper method to calculate discount amount
  calculateDiscount(subtotal: number): number {
    if (!this.isActive || (this.expiresAt && this.expiresAt < new Date())) {
      return 0;
    }
    return Math.min(this.discount, subtotal);
  }
} 