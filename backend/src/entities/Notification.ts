import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
  RETRYING = 'RETRYING',
  CANCELED = 'CANCELED',
}

export enum NotificationType {
  // Customer notifications
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELED = 'ORDER_CANCELED',
  SHIPPING_UPDATE = 'SHIPPING_UPDATE',
  PAYMENT_SUCCESSFUL = 'PAYMENT_SUCCESSFUL',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  REVIEW_REQUESTED = 'REVIEW_REQUESTED',
  
  // Account notifications
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_VERIFICATION = 'ACCOUNT_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  
  // Marketing notifications
  ABANDONED_CART = 'ABANDONED_CART',
  BACK_IN_STOCK = 'BACK_IN_STOCK',
  PRICE_DROP = 'PRICE_DROP',
  PROMOTIONAL_OFFER = 'PROMOTIONAL_OFFER',
  
  // Admin/staff notifications
  INVENTORY_ALERT = 'INVENTORY_ALERT',
  NEW_ORDER_ALERT = 'NEW_ORDER_ALERT',
  SUPPORT_REQUEST = 'SUPPORT_REQUEST',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK'
}

export enum NotificationPriority {
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW'
}

export interface NotificationMetadata {
  userId?: string;
  orderId?: string;
  productId?: string;
  templateId?: string;
  source?: string;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: any;
}

export interface NotificationJSON {
  id: string;
  to: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: NotificationStatus;
  subject: string;
  content: string;
  htmlContent?: string;
  errorLog?: string[];
  retryCount: number;
  nextRetryAt?: string;
  sentAt?: string;
  scheduledAt?: string;
  metadata?: NotificationMetadata;
  createdAt: string;
  updatedAt: string;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  to!: string; // Recipient (email, phone, etc.)

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  @Index()
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.EMAIL
  })
  channel!: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL
  })
  priority!: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.QUEUED
  })
  @Index()
  status!: NotificationStatus;

  @Column()
  subject!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  htmlContent?: string;

  @Column({ type: 'jsonb', nullable: true })
  errorLog?: string[];

  @Column({ default: 0 })
  retryCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: NotificationMetadata;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Check if notification can be retried
   */
  canRetry(): boolean {
    return this.status === NotificationStatus.FAILED || 
           this.status === NotificationStatus.ERROR;
  }

  /**
   * Check if notification is permanently failed
   */
  isPermanentlyFailed(): boolean {
    return this.retryCount >= 3 && 
           (this.status === NotificationStatus.FAILED || 
            this.status === NotificationStatus.ERROR);
  }

  /**
   * Check if notification is ready to be sent
   */
  isReadyToSend(): boolean {
    return this.status === NotificationStatus.QUEUED &&
           (!this.scheduledAt || this.scheduledAt <= new Date());
  }

  /**
   * Mark notification as sending
   */
  markAsSending(): void {
    this.status = NotificationStatus.SENDING;
    this.updatedAt = new Date();
  }

  /**
   * Mark notification as sent
   */
  markAsSent(): void {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Mark notification as failed
   */
  markAsFailed(error?: string): void {
    this.status = NotificationStatus.FAILED;
    this.retryCount += 1;
    
    if (error) {
      this.errorLog = this.errorLog || [];
      this.errorLog.push(`${new Date().toISOString()}: ${error}`);
    }
    
    // Calculate next retry time (exponential backoff)
    if (this.retryCount < 3) {
      const delay = Math.pow(2, this.retryCount) * 1000; // 2s, 4s, 8s
      this.nextRetryAt = new Date(Date.now() + delay);
    }
    
    this.updatedAt = new Date();
  }

  /**
   * Mark notification as retrying
   */
  markAsRetrying(): void {
    this.status = NotificationStatus.RETRYING;
    this.updatedAt = new Date();
  }

  /**
   * Cancel notification
   */
  cancel(): void {
    this.status = NotificationStatus.CANCELED;
    this.updatedAt = new Date();
  }

  /**
   * Convert to JSON for response
   */
  toJSON(): NotificationJSON {
    return {
      id: this.id,
      to: this.to,
      type: this.type,
      channel: this.channel,
      priority: this.priority,
      status: this.status,
      subject: this.subject,
      content: this.content,
      htmlContent: this.htmlContent,
      errorLog: this.errorLog,
      retryCount: this.retryCount,
      nextRetryAt: this.nextRetryAt?.toISOString(),
      sentAt: this.sentAt?.toISOString(),
      scheduledAt: this.scheduledAt?.toISOString(),
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
} 