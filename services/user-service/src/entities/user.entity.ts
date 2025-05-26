import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Address } from './address.entity';
import { LoyaltyProgramEnrollment } from './loyalty-program-enrollment.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  RESTRICTED = 'restricted'
}

@Entity('users', { synchronize: false }) // Prevent TypeORM from modifying the table
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ select: false, nullable: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    enumName: 'user_role_enum',
    nullable: true
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
    enumName: 'user_status_enum',
    nullable: true
  })
  status: UserStatus;

  @Column({ nullable: true, name: 'phone_number' })
  phoneNumber?: string;

  @Column({ nullable: true })
  country?: string;

  // Auth fields from auth-service
  @Column({ nullable: true, name: 'google_id' })
  googleId?: string;

  @Column({ default: false, name: 'is_2fa_enabled' })
  is2faEnabled: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'last_login' })
  lastLogin?: Date;

  @Column({ nullable: true, name: 'reset_token' })
  resetToken?: string;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'reset_token_expires' })
  resetTokenExpires?: Date;

  @Column({ default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'account_locked_until' })
  accountLockedUntil?: Date;

  @Column({ default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  @Column({ nullable: true, name: 'two_factor_secret' })
  twoFactorSecret?: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Address, address => address.user)
  addresses?: Address[];

  @OneToOne(() => LoyaltyProgramEnrollment, enrollment => enrollment.user)
  loyaltyProgram?: LoyaltyProgramEnrollment;

  // Exclude password when converting to JSON
  toJSON() {
    const { password, twoFactorSecret, resetToken, ...obj } = this;
    return obj;
  }
} 