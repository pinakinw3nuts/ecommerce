import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { hashPassword } from '../utils/password';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  RESTRICTED = 'restricted'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null = null;

  @Index('idx_user_email', { unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: UserRole.USER,
    transformer: {
      to: (value: UserRole) => value,
      from: (value: string) => value as UserRole
    }
  })
  role: UserRole = UserRole.USER;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
    enumName: 'users_status_enum'
  })
  status: UserStatus = UserStatus.PENDING;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'phone_number'
  })
  phoneNumber: string | null = null;

  @Column({
    type: 'varchar',
    length: 2,
    nullable: true,
    name: 'country'
  })
  country: string | null = null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'google_id'
  })
  googleId: string | null = null;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_2fa_enabled'
  })
  is2FAEnabled: boolean = false;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'created_at'
  })
  createdAt: Date = new Date();

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    name: 'updated_at'
  })
  updatedAt: Date = new Date();

  // Additional fields for security
  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'last_login'
  })
  lastLogin: Date | null = null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'reset_token',
    select: false
  })
  resetToken: string | null = null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'reset_token_expires'
  })
  resetTokenExpires: Date | null = null;

  @Column({
    type: 'integer',
    default: 0,
    name: 'failed_login_attempts'
  })
  failedLoginAttempts: number = 0;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'account_locked_until'
  })
  accountLockedUntil: Date | null = null;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_email_verified'
  })
  isEmailVerified: boolean = false;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'two_factor_secret',
    select: false
  })
  twoFactorSecret: string | null = null;

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPasswordBeforeSave() {
    if (this.password) {
      this.password = await hashPassword(this.password);
    }
  }

  // Helper methods
  isAccountLocked(): boolean {
    if (!this.accountLockedUntil) return false;
    return new Date() < this.accountLockedUntil;
  }

  incrementFailedLoginAttempts() {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts for 15 minutes
    if (this.failedLoginAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      this.accountLockedUntil = lockUntil;
    }
  }

  resetFailedLoginAttempts() {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
  }

  toJSON() {
    const { password, resetToken, twoFactorSecret, ...safeObj } = this;
    return safeObj;
  }
} 