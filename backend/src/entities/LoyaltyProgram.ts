import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

export interface LoyaltyBenefits {
  freeShipping: boolean;
  birthdayBonus: boolean;
  exclusiveOffers: boolean;
  prioritySupport: boolean;
  earlyAccess: boolean;
  personalShopper: boolean;
}

export interface LoyaltyProgramJSON {
  id: string;
  userId: string;
  points: number;
  tier: LoyaltyTier;
  benefits: LoyaltyBenefits;
  enrolledAt: string;
  lastPointsEarnedAt?: string;
  tierUpgradedAt?: string;
  isActive: boolean;
  nextTierThreshold: number | null;
  pointsToNextTier: number | null;
  createdAt: string;
  updatedAt: string;
}

@Entity('loyalty_programs')
export class LoyaltyProgram {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { unique: true })
  @Index()
  userId!: string;

  @Column({ type: 'integer', default: 0 })
  points!: number;

  @Column({
    type: 'enum',
    enum: LoyaltyTier,
    default: LoyaltyTier.BRONZE
  })
  tier!: LoyaltyTier;

  @Column({ type: 'jsonb' })
  benefits!: LoyaltyBenefits;

  @Column({ type: 'timestamp' })
  enrolledAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastPointsEarnedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  tierUpgradedAt?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Get tier thresholds
   */
  private static getTierThresholds(): Record<LoyaltyTier, number> {
    return {
      [LoyaltyTier.BRONZE]: 0,
      [LoyaltyTier.SILVER]: 1000,
      [LoyaltyTier.GOLD]: 5000,
      [LoyaltyTier.PLATINUM]: 10000
    };
  }

  /**
   * Get benefits for tier
   */
  private static getBenefitsForTier(tier: LoyaltyTier): LoyaltyBenefits {
    const baseBenefits: LoyaltyBenefits = {
      freeShipping: false,
      birthdayBonus: false,
      exclusiveOffers: false,
      prioritySupport: false,
      earlyAccess: false,
      personalShopper: false,
    };

    switch (tier) {
      case LoyaltyTier.BRONZE:
        return {
          ...baseBenefits,
          birthdayBonus: true,
        };
      case LoyaltyTier.SILVER:
        return {
          ...baseBenefits,
          freeShipping: true,
          birthdayBonus: true,
          exclusiveOffers: true,
        };
      case LoyaltyTier.GOLD:
        return {
          ...baseBenefits,
          freeShipping: true,
          birthdayBonus: true,
          exclusiveOffers: true,
          prioritySupport: true,
          earlyAccess: true,
        };
      case LoyaltyTier.PLATINUM:
        return {
          ...baseBenefits,
          freeShipping: true,
          birthdayBonus: true,
          exclusiveOffers: true,
          prioritySupport: true,
          earlyAccess: true,
          personalShopper: true,
        };
      default:
        return baseBenefits;
    }
  }

  /**
   * Initialize loyalty program with default values
   */
  static create(userId: string): LoyaltyProgram {
    const program = new LoyaltyProgram();
    program.userId = userId;
    program.points = 0;
    program.tier = LoyaltyTier.BRONZE;
    program.benefits = this.getBenefitsForTier(LoyaltyTier.BRONZE);
    program.enrolledAt = new Date();
    program.isActive = true;
    
    return program;
  }

  /**
   * Add points to the program
   */
  addPoints(points: number): boolean {
    if (points <= 0 || !this.isActive) {
      return false;
    }

    const previousTier = this.tier;
    this.points += points;
    this.lastPointsEarnedAt = new Date();

    // Check for tier upgrade
    const newTier = this.calculateTier();
    if (newTier !== previousTier) {
      this.upgradeTier(newTier);
      return true; // Tier upgraded
    }

    return false; // No tier upgrade
  }

  /**
   * Deduct points from the program
   */
  deductPoints(points: number): boolean {
    if (points <= 0 || points > this.points || !this.isActive) {
      return false;
    }

    this.points -= points;
    return true;
  }

  /**
   * Calculate current tier based on points
   */
  private calculateTier(): LoyaltyTier {
    const thresholds = LoyaltyProgram.getTierThresholds();
    
    if (this.points >= thresholds[LoyaltyTier.PLATINUM]) {
      return LoyaltyTier.PLATINUM;
    } else if (this.points >= thresholds[LoyaltyTier.GOLD]) {
      return LoyaltyTier.GOLD;
    } else if (this.points >= thresholds[LoyaltyTier.SILVER]) {
      return LoyaltyTier.SILVER;
    } else {
      return LoyaltyTier.BRONZE;
    }
  }

  /**
   * Upgrade tier and update benefits
   */
  private upgradeTier(newTier: LoyaltyTier): void {
    this.tier = newTier;
    this.benefits = LoyaltyProgram.getBenefitsForTier(newTier);
    this.tierUpgradedAt = new Date();
  }

  /**
   * Get next tier
   */
  getNextTier(): LoyaltyTier | null {
    const tiers = Object.values(LoyaltyTier);
    const currentIndex = tiers.indexOf(this.tier);
    
    if (currentIndex === -1 || currentIndex >= tiers.length - 1) {
      return null;
    }
    
    return tiers[currentIndex + 1] as LoyaltyTier;
  }

  /**
   * Get points needed for next tier
   */
  getPointsToNextTier(): number | null {
    const nextTier = this.getNextTier();
    if (!nextTier) {
      return null;
    }

    const thresholds = LoyaltyProgram.getTierThresholds();
    return thresholds[nextTier] - this.points;
  }

  /**
   * Get next tier threshold
   */
  getNextTierThreshold(): number | null {
    const nextTier = this.getNextTier();
    if (!nextTier) {
      return null;
    }

    const thresholds = LoyaltyProgram.getTierThresholds();
    return thresholds[nextTier];
  }

  /**
   * Check if user can upgrade tier
   */
  canUpgradeTier(): boolean {
    const nextTier = this.getNextTier();
    if (!nextTier) {
      return false;
    }

    const requiredPoints = this.getNextTierThreshold();
    return requiredPoints !== null && this.points >= requiredPoints;
  }

  /**
   * Get tier progress percentage
   */
  getTierProgress(): number {
    const nextTierThreshold = this.getNextTierThreshold();
    if (!nextTierThreshold) {
      return 100; // Already at max tier
    }

    const thresholds = LoyaltyProgram.getTierThresholds();
    const currentTierThreshold = thresholds[this.tier];
    const progressRange = nextTierThreshold - currentTierThreshold;
    const currentProgress = this.points - currentTierThreshold;

    return Math.min(100, Math.max(0, (currentProgress / progressRange) * 100));
  }

  /**
   * Convert to JSON for response
   */
  toJSON(): LoyaltyProgramJSON {
    return {
      id: this.id,
      userId: this.userId,
      points: this.points,
      tier: this.tier,
      benefits: this.benefits,
      enrolledAt: this.enrolledAt.toISOString(),
      lastPointsEarnedAt: this.lastPointsEarnedAt?.toISOString(),
      tierUpgradedAt: this.tierUpgradedAt?.toISOString(),
      isActive: this.isActive,
      nextTierThreshold: this.getNextTierThreshold(),
      pointsToNextTier: this.getPointsToNextTier(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}