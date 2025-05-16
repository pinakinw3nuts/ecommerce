import { Entity, Column, OneToMany, OneToOne, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Address } from './address.entity';
import { LoyaltyProgramEnrollment } from './loyalty-program-enrollment.entity';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

@Entity('users')
export class User extends BaseEntity {
  @Column()
  @Index({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Column({ nullable: true })
  phone?: string;

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

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    newsletter: boolean;
    marketing: boolean;
    theme?: 'light' | 'dark';
    language?: string;
  };

  @OneToMany(() => Address, address => address.user)
  addresses?: Address[];

  @OneToOne(() => LoyaltyProgramEnrollment, enrollment => enrollment.user)
  loyaltyProgram?: LoyaltyProgramEnrollment;

  // Exclude password when converting to JSON
  toJSON() {
    const { password, ...obj } = this;
    return obj;
  }
} 