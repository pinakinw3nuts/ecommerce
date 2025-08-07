import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { 
  Notification, 
  NotificationStatus, 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  NotificationMetadata 
} from '../entities/Notification';
import { emailTemplates, getTemplate, interpolateTemplate } from '../templates/emailTemplates';
import { logger } from '../utils/logger';

export interface SendNotificationOptions {
  to: string | string[];
  type: NotificationType;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  subject?: string;
  content?: string;
  htmlContent?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  scheduledAt?: Date;
  metadata?: NotificationMetadata;
}

export interface NotificationListOptions {
  page?: number;
  limit?: number;
  status?: NotificationStatus | NotificationStatus[];
  type?: NotificationType | NotificationType[];
  channel?: NotificationChannel;
  to?: string;
  createdAtStart?: Date;
  createdAtEnd?: Date;
  sortBy?: keyof Notification;
  sortOrder?: 'ASC' | 'DESC';
}

export interface NotificationStats {
  total: number;
  queued: number;
  sending: number;
  sent: number;
  failed: number;
  retrying: number;
  canceled: number;
}

export class NotificationService {
  private notificationRepo: Repository<Notification>;

  constructor() {
    this.notificationRepo = AppDataSource.getRepository(Notification);
  }

  /**
   * Send a notification
   */
  async sendNotification(options: SendNotificationOptions): Promise<Notification[]> {
    logger.info('Sending notification:', { 
      type: options.type, 
      channel: options.channel, 
      recipientCount: Array.isArray(options.to) ? options.to.length : 1 
    });

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const notifications: Notification[] = [];

      for (const recipient of recipients) {
        const notification = await this.createNotification({
          to: recipient,
          type: options.type,
          channel: options.channel || NotificationChannel.EMAIL,
          priority: options.priority || NotificationPriority.NORMAL,
          subject: options.subject,
          content: options.content,
          htmlContent: options.htmlContent,
          templateId: options.templateId,
          templateData: options.templateData,
          scheduledAt: options.scheduledAt,
          metadata: options.metadata,
        });

        notifications.push(notification);
      }

      // Process notifications immediately if not scheduled
      if (!options.scheduledAt) {
        await this.processNotifications(notifications);
      }

      logger.info('Notifications created successfully:', { 
        count: notifications.length, 
        type: options.type 
      });

      return notifications;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Create a notification record
   */
  private async createNotification(options: SendNotificationOptions & { to: string }): Promise<Notification> {
    let subject = options.subject;
    let content = options.content;
    let htmlContent = options.htmlContent;

    // Process template if provided
    if (options.templateId && options.templateData) {
      const template = getTemplate(options.templateId);
      if (!template) {
        throw new Error(`Template not found: ${options.templateId}`);
      }

      subject = subject || interpolateTemplate(template.subject, options.templateData);
      content = content || interpolateTemplate(template.text, options.templateData);
      htmlContent = htmlContent || interpolateTemplate(template.html, options.templateData);
    }

    if (!subject || !content) {
      throw new Error('Subject and content are required');
    }

    const notification = this.notificationRepo.create({
      to: options.to,
      type: options.type,
      channel: options.channel || NotificationChannel.EMAIL,
      priority: options.priority || NotificationPriority.NORMAL,
      status: NotificationStatus.QUEUED,
      subject,
      content,
      htmlContent,
      scheduledAt: options.scheduledAt,
      metadata: options.metadata,
    });

    return await this.notificationRepo.save(notification);
  }

  /**
   * Process notifications (send them)
   */
  private async processNotifications(notifications: Notification[]): Promise<void> {
    for (const notification of notifications) {
      try {
        await this.processNotification(notification);
      } catch (error) {
        logger.error('Error processing notification:', { 
          notificationId: notification.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }

  /**
   * Process a single notification
   */
  private async processNotification(notification: Notification): Promise<void> {
    if (!notification.isReadyToSend()) {
      return;
    }

    notification.markAsSending();
    await this.notificationRepo.save(notification);

    try {
      // Send based on channel
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(notification);
          break;
        case NotificationChannel.SMS:
          await this.sendSMS(notification);
          break;
        case NotificationChannel.PUSH:
          await this.sendPush(notification);
          break;
        case NotificationChannel.WEBHOOK:
          await this.sendWebhook(notification);
          break;
        default:
          throw new Error(`Unsupported channel: ${notification.channel}`);
      }

      notification.markAsSent();
      await this.notificationRepo.save(notification);

      logger.info('Notification sent successfully:', { 
        notificationId: notification.id, 
        type: notification.type 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      notification.markAsFailed(errorMessage);
      await this.notificationRepo.save(notification);

      logger.error('Notification failed:', { 
        notificationId: notification.id, 
        error: errorMessage 
      });
    }
  }

  /**
   * Send email notification (mock implementation for development)
   */
  private async sendEmail(notification: Notification): Promise<void> {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 EMAIL SENT (MOCK):', {
        to: notification.to,
        subject: notification.subject,
        content: notification.content.substring(0, 100) + '...',
        htmlContent: notification.htmlContent ? 'HTML content available' : 'No HTML content'
      });
      return;
    }

    // TODO: Implement real email sending (SendGrid, Mailgun, etc.)
    throw new Error('Email sending not implemented in production');
  }

  /**
   * Send SMS notification (mock implementation)
   */
  private async sendSMS(notification: Notification): Promise<void> {
    logger.info('📱 SMS SENT (MOCK):', {
      to: notification.to,
      content: notification.content.substring(0, 100) + '...'
    });
    // TODO: Implement real SMS sending (Twilio, etc.)
  }

  /**
   * Send push notification (mock implementation)
   */
  private async sendPush(notification: Notification): Promise<void> {
    logger.info('🔔 PUSH SENT (MOCK):', {
      to: notification.to,
      content: notification.content.substring(0, 100) + '...'
    });
    // TODO: Implement real push notifications
  }

  /**
   * Send webhook notification (mock implementation)
   */
  private async sendWebhook(notification: Notification): Promise<void> {
    logger.info('🌐 WEBHOOK SENT (MOCK):', {
      to: notification.to,
      content: notification.content.substring(0, 100) + '...'
    });
    // TODO: Implement real webhook sending
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    logger.info('Getting notification by ID:', { id });

    try {
      const notification = await this.notificationRepo.findOne({
        where: { id }
      });

      if (!notification) {
        logger.warn('Notification not found:', { id });
        return null;
      }

      return notification;
    } catch (error) {
      logger.error('Error getting notification by ID:', error);
      throw error;
    }
  }

  /**
   * List notifications with filtering and pagination
   */
  async listNotifications(options: NotificationListOptions = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      channel,
      to,
      createdAtStart,
      createdAtEnd,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = options;

    logger.info('Listing notifications:', { page, limit, status, type, channel });

    try {
      const queryBuilder = this.notificationRepo.createQueryBuilder('notification');

      // Apply filters
      if (status) {
        if (Array.isArray(status)) {
          queryBuilder.andWhere('notification.status IN (:...status)', { status });
        } else {
          queryBuilder.andWhere('notification.status = :status', { status });
        }
      }

      if (type) {
        if (Array.isArray(type)) {
          queryBuilder.andWhere('notification.type IN (:...type)', { type });
        } else {
          queryBuilder.andWhere('notification.type = :type', { type });
        }
      }

      if (channel) {
        queryBuilder.andWhere('notification.channel = :channel', { channel });
      }

      if (to) {
        queryBuilder.andWhere('notification.to ILIKE :to', { to: `%${to}%` });
      }

      if (createdAtStart) {
        queryBuilder.andWhere('notification.createdAt >= :createdAtStart', { createdAtStart });
      }

      if (createdAtEnd) {
        queryBuilder.andWhere('notification.createdAt <= :createdAtEnd', { createdAtEnd });
      }

      // Apply sorting
      queryBuilder.orderBy(`notification.${sortBy}`, sortOrder);

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [notifications, total] = await queryBuilder.getManyAndCount();

      logger.info('Notifications listed successfully:', { count: notifications.length, total });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error listing notifications:', error);
      throw error;
    }
  }

  /**
   * Retry failed notification
   */
  async retryNotification(id: string): Promise<Notification> {
    logger.info('Retrying notification:', { id });

    try {
      const notification = await this.getNotificationById(id);
      if (!notification) {
        throw new Error('Notification not found');
      }

      if (!notification.canRetry()) {
        throw new Error('Notification cannot be retried');
      }

      notification.markAsRetrying();
      await this.notificationRepo.save(notification);

      // Process the notification
      await this.processNotification(notification);

      logger.info('Notification retry completed:', { id });
      return notification;
    } catch (error) {
      logger.error('Error retrying notification:', error);
      throw error;
    }
  }

  /**
   * Cancel notification
   */
  async cancelNotification(id: string): Promise<Notification> {
    logger.info('Canceling notification:', { id });

    try {
      const notification = await this.getNotificationById(id);
      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.cancel();
      const updatedNotification = await this.notificationRepo.save(notification);

      logger.info('Notification canceled successfully:', { id });
      return updatedNotification;
    } catch (error) {
      logger.error('Error canceling notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    logger.info('Getting notification statistics');

    try {
      const stats = await this.notificationRepo
        .createQueryBuilder('notification')
        .select('notification.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('notification.status')
        .getRawMany();

      const result: NotificationStats = {
        total: 0,
        queued: 0,
        sending: 0,
        sent: 0,
        failed: 0,
        retrying: 0,
        canceled: 0,
      };

      stats.forEach(stat => {
        const count = parseInt(stat.count);
        result.total += count;
        result[stat.status.toLowerCase() as keyof NotificationStats] = count;
      });

      logger.info('Notification statistics retrieved:', result);
      return result;
    } catch (error) {
      logger.error('Error getting notification statistics:', error);
      throw error;
    }
  }

  /**
   * Get available email templates
   */
  async getEmailTemplates() {
    return {
      templates: Object.values(emailTemplates),
      categories: ['orders', 'payments', 'account', 'marketing']
    };
  }

  /**
   * Process scheduled notifications (should be called by a cron job)
   */
  async processScheduledNotifications(): Promise<number> {
    logger.info('Processing scheduled notifications');

    try {
      const scheduledNotifications = await this.notificationRepo.find({
        where: {
          status: NotificationStatus.QUEUED,
          scheduledAt: new Date()
        }
      });

      if (scheduledNotifications.length === 0) {
        logger.info('No scheduled notifications to process');
        return 0;
      }

      await this.processNotifications(scheduledNotifications);

      logger.info('Scheduled notifications processed:', { count: scheduledNotifications.length });
      return scheduledNotifications.length;
    } catch (error) {
      logger.error('Error processing scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * Retry failed notifications (should be called by a cron job)
   */
  async retryFailedNotifications(): Promise<number> {
    logger.info('Retrying failed notifications');

    try {
      const failedNotifications = await this.notificationRepo.find({
        where: {
          status: NotificationStatus.FAILED,
          retryCount: 3
        }
      });

      if (failedNotifications.length === 0) {
        logger.info('No failed notifications to retry');
        return 0;
      }

      let retriedCount = 0;
      for (const notification of failedNotifications) {
        try {
          await this.retryNotification(notification.id);
          retriedCount++;
        } catch (error) {
          logger.error('Failed to retry notification:', { 
            notificationId: notification.id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      logger.info('Failed notifications retry completed:', { retriedCount });
      return retriedCount;
    } catch (error) {
      logger.error('Error retrying failed notifications:', error);
      throw error;
    }
  }
} 