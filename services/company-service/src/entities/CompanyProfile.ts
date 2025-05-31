import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Company } from './Company';

@Entity('company_profiles')
export class CompanyProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index({ unique: true })
  companyId: string;

  @OneToOne(() => Company, company => company.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: true })
  businessType: string;

  @Column({ nullable: true })
  yearEstablished: number;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  numberOfEmployees: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  taxInformation: {
    taxId?: string;
    vatNumber?: string;
    taxExemptionCertificate?: string;
    taxClassification?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  bankInformation: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    routingNumber?: string;
    swiftCode?: string;
    iban?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  additionalContacts: Array<{
    name: string;
    title: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  documents: Array<{
    name: string;
    type: string;
    url: string;
    uploadedAt: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 