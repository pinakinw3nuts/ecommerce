import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  JoinColumn,
  ManyToOne
} from 'typeorm';

/**
 * Enum for admin action types
 */
export enum AdminActionType {
  // User management
  USER_VIEW = 'USER_VIEW',
  USER_UPDATE = 'USER_UPDATE',
  USER_SUSPEND = 'USER_SUSPEND',
  USER_UNSUSPEND = 'USER_UNSUSPEND',
  USER_DELETE = 'USER_DELETE',
  
  // Product management
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  PRODUCT_VIEW = 'PRODUCT_VIEW',
  
  // Order management
  ORDER_VIEW = 'ORDER_VIEW',
  ORDER_UPDATE = 'ORDER_UPDATE',
  ORDER_REFUND = 'ORDER_REFUND',
  ORDER_CANCEL = 'ORDER_CANCEL',
  
  // System actions
  DASHBOARD_VIEW = 'DASHBOARD_VIEW',
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  EXPORT_DATA = 'EXPORT_DATA',
  
  // Other
  OTHER = 'OTHER'
}

/**
 * Data transfer object for creating activity logs
 */
export interface CreateActivityLogDto {
  adminId: string;
  actionType: AdminActionType;
  targetId?: string;
  targetType?: string;
  meta?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Admin Activity Log entity
 * Tracks all administrative actions for audit and compliance purposes
 */
@Entity('admin_activity_logs')
export class AdminActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  adminId!: string;

  @Column({
    type: 'enum',
    enum: AdminActionType,
    default: AdminActionType.OTHER
  })
  @Index()
  actionType!: AdminActionType;

  @Column({ nullable: true })
  @Index()
  targetId!: string;

  @Column({ 
    type: 'varchar',
    nullable: true
  })
  targetType!: string;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string;

  @Column({ type: 'varchar', nullable: true })
  userAgent!: string;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;
}