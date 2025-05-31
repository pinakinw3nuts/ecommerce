import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
  Check
} from 'typeorm';
import { CompanyUser } from './CompanyUser';
import { CompanyProfile } from './CompanyProfile';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  name: string;

  @Column({ nullable: true, unique: true })
  @Index()
  gstNumber: string;

  @Column({ 
    type: 'decimal', 
    precision: 12, 
    scale: 2,
    default: 0,
    nullable: false
  })
  @Check('"creditLimit" >= 0')
  creditLimit: number;

  @Column({ nullable: false, default: 0 })
  availableCredit: number;

  @Column({ nullable: false })
  @Index()
  country: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'jsonb', nullable: true })
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    allowPurchaseOrders: boolean;
    requirePOApproval: boolean;
    invoiceTermDays: number;
    taxExempt: boolean;
    allowedPaymentMethods: string[];
  };

  @OneToMany(() => CompanyUser, companyUser => companyUser.company, { cascade: true })
  users: CompanyUser[];

  @OneToOne(() => CompanyProfile, profile => profile.company, { cascade: true })
  profile: CompanyProfile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 