import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique
} from 'typeorm';
import { Company } from './Company';
import { CompanyRole } from '../constants/roles';

@Entity('company_users')
@Unique(['userId', 'companyId']) // Ensure a user can have only one role per company
export class CompanyUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  companyId: string;

  @ManyToOne(() => Company, company => company.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({
    type: 'enum',
    enum: CompanyRole,
    default: CompanyRole.VIEWER
  })
  role: CompanyRole;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'jsonb', nullable: true })
  permissions: {
    canManageUsers: boolean;
    canViewReports: boolean;
    canApproveOrders: boolean;
    orderApprovalLimit?: number;
    canManageProducts: boolean;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  invitationToken: string;

  @Column({ nullable: true })
  invitationExpiry: Date;

  @Column({ default: false })
  hasAcceptedInvitation: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 