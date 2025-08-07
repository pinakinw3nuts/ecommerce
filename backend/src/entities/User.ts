import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  Index, 
  OneToMany,
  OneToOne 
} from 'typeorm';
import { Address } from './Address';
import { LoyaltyProgram } from './LoyaltyProgram';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  BANNED = 'BANNED'
}

export interface UserPreferences {
  newsletter: boolean;
  marketing: boolean;
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
}

export interface UserJSON {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  avatar?: string;
  isEmailVerified: boolean;
  is2faEnabled: boolean;
  lastLogin?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
  addresses?: any[];
  loyaltyProgram?: any;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE
  })
  status!: UserStatus;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ type: 'text', nullable: true })
  avatar?: string;

  // Auth fields
  @Column({ nullable: true })
  googleId?: string;

  @Column({ default: false })
  is2faEnabled!: boolean;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @Column({ nullable: true })
  resetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpires?: Date;

  @Column({ default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamp', nullable: true })
  accountLockedUntil?: Date;

  @Column({ nullable: true })
  twoFactorSecret?: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  // User preferences
  @Column({ type: 'jsonb', nullable: true })
  preferences?: UserPreferences;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Address, address => address.user)
  addresses!: Address[];

  @OneToOne(() => LoyaltyProgram, loyalty => loyalty.user)
  loyaltyProgram!: LoyaltyProgram;

  /**
   * Check if user account is locked
   */
  isAccountLocked(): boolean {
    return this.accountLockedUntil ? new Date() < this.accountLockedUntil : false;
  }

  /**
   * Check if user can attempt login
   */
  canAttemptLogin(): boolean {
    return !this.isAccountLocked() && this.status === UserStatus.ACTIVE;
  }

  /**
   * Increment failed login attempts
   */
  incrementFailedLoginAttempts(): void {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.failedLoginAttempts >= 5) {
      this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
  }

  /**
   * Reset failed login attempts
   */
  resetFailedLoginAttempts(): void {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = undefined;
    this.lastLogin = new Date();
  }

  /**
   * Check if user has admin role
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Get default preferences
   */
  getDefaultPreferences(): UserPreferences {
    return {
      newsletter: true,
      marketing: false,
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      privacy: {
        profileVisible: true,
        showEmail: false,
        showPhone: false,
      },
    };
  }

  /**
   * Convert to JSON for response
   */
  toJSON(): UserJSON {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      status: this.status,
      phoneNumber: this.phoneNumber,
      avatar: this.avatar,
      isEmailVerified: this.isEmailVerified,
      is2faEnabled: this.is2faEnabled,
      lastLogin: this.lastLogin ? this.lastLogin.toISOString() : undefined,
      preferences: this.preferences || this.getDefaultPreferences(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      addresses: this.addresses?.map(addr => addr.toJSON()) || [],
      loyaltyProgram: this.loyaltyProgram?.toJSON() || null,
    };
  }
} 