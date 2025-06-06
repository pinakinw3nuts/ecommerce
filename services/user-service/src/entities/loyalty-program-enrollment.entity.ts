import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

@Entity('loyalty_program_enrollments', { synchronize: false })
export class LoyaltyProgramEnrollment extends BaseEntity {
  @Column({ type: 'integer', default: 0 })
  points!: number;

  @Column({
    type: 'enum',
    enum: LoyaltyTier,
    default: LoyaltyTier.BRONZE,
    enumName: 'loyalty_tier_enum'
  })
  tier!: LoyaltyTier;

  @Column({ name: 'enrolled_at', type: 'timestamp with time zone' })
  enrolledAt!: Date;

  @Column({ name: 'last_points_earned_at', type: 'timestamp with time zone', nullable: true })
  lastPointsEarnedAt?: Date;

  @Column({ name: 'tier_upgraded_at', type: 'timestamp with time zone', nullable: true })
  tierUpgradedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  benefits!: {
    freeShipping: boolean;
    birthdayBonus: boolean;
    exclusiveOffers: boolean;
    prioritySupport: boolean;
  };

  @Column({ default: true })
  isActive!: boolean;

  @OneToOne(() => User, user => user.loyaltyProgram)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  // Method to check if user can upgrade tier
  canUpgradeTier(): boolean {
    const pointsThresholds = {
      [LoyaltyTier.BRONZE]: 0,
      [LoyaltyTier.SILVER]: 1000,
      [LoyaltyTier.GOLD]: 5000,
      [LoyaltyTier.PLATINUM]: 10000
    };

    const nextTier = this.getNextTier();
    if (!nextTier) return false;
    return this.points >= pointsThresholds[nextTier];
  }

  // Helper method to get next tier
  private getNextTier(): LoyaltyTier | null {
    const tiers = Object.values(LoyaltyTier);
    const currentIndex = tiers.indexOf(this.tier);
    if (currentIndex === -1 || currentIndex >= tiers.length - 1) {
      return null;
    }
    return tiers[currentIndex + 1] as LoyaltyTier;
  }
} 