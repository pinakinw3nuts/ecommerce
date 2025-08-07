import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { NotificationService } from '../services/notification.service';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority, 
  NotificationStatus 
} from '../entities/Notification';
import { logger } from '../utils/logger';
import { requireAdmin, requireUser } from '../middleware/auth';

// Zod schemas for validation
const sendNotificationSchema = {
  type: 'object',
  required: ['to', 'type'],
  properties: {
    to: {
      oneOf: [
        { type: 'string', format: 'email' },
        { type: 'array', items: { type: 'string', format: 'email' } }
      ]
    },
    type: {
      type: 'string',
      enum: ['ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELED', 'SHIPPING_UPDATE', 'PAYMENT_SUCCESSFUL', 'PAYMENT_FAILED', 'REFUND_PROCESSED', 'REVIEW_REQUESTED', 'ACCOUNT_CREATED', 'ACCOUNT_VERIFICATION', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'PROFILE_UPDATED', 'ABANDONED_CART', 'BACK_IN_STOCK', 'PRICE_DROP', 'PROMOTIONAL_OFFER', 'INVENTORY_ALERT', 'NEW_ORDER_ALERT', 'SUPPORT_REQUEST', 'SYSTEM_ALERT']
    },
    channel: {
      type: 'string',
      enum: ['EMAIL', 'SMS', 'PUSH', 'WEBHOOK'],
      default: 'EMAIL'
    },
    priority: {
      type: 'string',
      enum: ['HIGH', 'NORMAL', 'LOW'],
      default: 'NORMAL'
    },
    subject: { type: 'string' },
    content: { type: 'string' },
    htmlContent: { type: 'string' },
    templateId: { type: 'string' },
    templateData: { type: 'object' },
    scheduledAt: { type: 'string', format: 'date-time' },
    metadata: { type: 'object' }
  }
};

const listNotificationsSchema = {
  type: 'object',
  properties: {
    page: { type: 'string', default: '1' },
    limit: { type: 'string', default: '10' },
    status: {
      oneOf: [
        { type: 'string', enum: ['QUEUED', 'SENDING', 'SENT', 'FAILED', 'ERROR', 'RETRYING', 'CANCELED'] },
        { type: 'array', items: { type: 'string', enum: ['QUEUED', 'SENDING', 'SENT', 'FAILED', 'ERROR', 'RETRYING', 'CANCELED'] } }
      ]
    },
    type: {
      oneOf: [
        { type: 'string', enum: ['ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELED', 'SHIPPING_UPDATE', 'PAYMENT_SUCCESSFUL', 'PAYMENT_FAILED', 'REFUND_PROCESSED', 'REVIEW_REQUESTED', 'ACCOUNT_CREATED', 'ACCOUNT_VERIFICATION', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'PROFILE_UPDATED', 'ABANDONED_CART', 'BACK_IN_STOCK', 'PRICE_DROP', 'PROMOTIONAL_OFFER', 'INVENTORY_ALERT', 'NEW_ORDER_ALERT', 'SUPPORT_REQUEST', 'SYSTEM_ALERT'] },
        { type: 'array', items: { type: 'string', enum: ['ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELED', 'SHIPPING_UPDATE', 'PAYMENT_SUCCESSFUL', 'PAYMENT_FAILED', 'REFUND_PROCESSED', 'REVIEW_REQUESTED', 'ACCOUNT_CREATED', 'ACCOUNT_VERIFICATION', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'PROFILE_UPDATED', 'ABANDONED_CART', 'BACK_IN_STOCK', 'PRICE_DROP', 'PROMOTIONAL_OFFER', 'INVENTORY_ALERT', 'NEW_ORDER_ALERT', 'SUPPORT_REQUEST', 'SYSTEM_ALERT'] } }
      ]
    },
    channel: {
      type: 'string',
      enum: ['EMAIL', 'SMS', 'PUSH', 'WEBHOOK']
    },
    to: { type: 'string' },
    createdAtStart: { type: 'string', format: 'date-time' },
    createdAtEnd: { type: 'string', format: 'date-time' },
    sortBy: { type: 'string', default: 'createdAt' },
    sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
  }
};

const notificationIdSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' }
  }
};

interface SendNotificationRequest {
  Body: {
    to: string | string[];
    type: string;
    channel?: string;
    priority?: string;
    subject?: string;
    content?: string;
    htmlContent?: string;
    templateId?: string;
    templateData?: Record<string, any>;
    scheduledAt?: string;
    metadata?: Record<string, any>;
  };
}

interface ListNotificationsRequest {
  Querystring: {
    page?: string;
    limit?: string;
    status?: string | string[];
    type?: string | string[];
    channel?: string;
    to?: string;
    createdAtStart?: string;
    createdAtEnd?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

interface NotificationIdRequest {
  Params: {
    id: string;
  };
}

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

export default async function notificationRoutes(fastify: FastifyInstance) {
  const notificationService = new NotificationService();

  // Send notification
  fastify.post('/send', {
    schema: {
      body: sendNotificationSchema,
    },
    preHandler: [requireUser()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const options = request.body as any;
      
              logger.info('Sending notification via API:', { 
          type: options.type, 
          channel: options.channel,
          recipientCount: Array.isArray(options.to) ? options.to.length : 1,
          userId: (request.user as AuthenticatedUser)?.id 
        });

      const notifications = await notificationService.sendNotification({
        ...options,
        metadata: {
          ...options.metadata,
          userId: (request.user as AuthenticatedUser)?.id,
          source: 'api',
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        },
      });

      reply.status(201).send({
        success: true,
        message: 'Notification sent successfully',
        data: {
          notifications: notifications.map(n => n.toJSON()),
          count: notifications.length,
        },
      });
    } catch (error) {
      logger.error('Error sending notification via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to send notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // List notifications
  fastify.get('/', {
    schema: {
      querystring: listNotificationsSchema,
    },
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;
      
      logger.info('Listing notifications via API:', { 
        page: query.page, 
        limit: query.limit,
        status: query.status,
        type: query.type,
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const result = await notificationService.listNotifications({
        page: query.page,
        limit: query.limit,
        status: query.status,
        type: query.type,
        channel: query.channel,
        to: query.to,
        createdAtStart: query.createdAtStart ? new Date(query.createdAtStart) : undefined,
        createdAtEnd: query.createdAtEnd ? new Date(query.createdAtEnd) : undefined,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder,
      });

      reply.status(200).send({
        success: true,
        data: {
          notifications: result.notifications.map(n => n.toJSON()),
          pagination: result.pagination,
        },
      });
    } catch (error) {
      logger.error('Error listing notifications via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to list notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get notification by ID
  fastify.get('/:id', {
    schema: {
      params: notificationIdSchema,
    },
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      
      logger.info('Getting notification by ID via API:', { 
        id, 
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const notification = await notificationService.getNotificationById(id);

      if (!notification) {
        return reply.status(404).send({
          success: false,
          message: 'Notification not found',
          error: 'NOTIFICATION_NOT_FOUND',
        });
      }

      reply.status(200).send({
        success: true,
        data: notification.toJSON(),
      });
    } catch (error) {
      logger.error('Error getting notification by ID via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to get notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Retry failed notification
  fastify.post('/:id/retry', {
    schema: {
      params: notificationIdSchema,
    },
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      
      logger.info('Retrying notification via API:', { 
        id, 
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const notification = await notificationService.retryNotification(id);

      reply.status(200).send({
        success: true,
        message: 'Notification retry initiated successfully',
        data: notification.toJSON(),
      });
    } catch (error) {
      logger.error('Error retrying notification via API:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: 'Notification not found',
          error: 'NOTIFICATION_NOT_FOUND',
        });
      }

      if (error instanceof Error && error.message.includes('cannot be retried')) {
        return reply.status(400).send({
          success: false,
          message: 'Notification cannot be retried',
          error: 'NOTIFICATION_CANNOT_RETRY',
        });
      }

      reply.status(500).send({
        success: false,
        message: 'Failed to retry notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Cancel notification
  fastify.delete('/:id', {
    schema: {
      params: notificationIdSchema,
    },
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      
      logger.info('Canceling notification via API:', { 
        id, 
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const notification = await notificationService.cancelNotification(id);

      reply.status(200).send({
        success: true,
        message: 'Notification canceled successfully',
        data: notification.toJSON(),
      });
    } catch (error) {
      logger.error('Error canceling notification via API:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: 'Notification not found',
          error: 'NOTIFICATION_NOT_FOUND',
        });
      }

      reply.status(500).send({
        success: false,
        message: 'Failed to cancel notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get notification statistics
  fastify.get('/stats/overview', {
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Getting notification statistics via API:', { 
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const stats = await notificationService.getNotificationStats();

      reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting notification statistics via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to get notification statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get email templates
  fastify.get('/templates/email', {
    preHandler: [requireUser()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Getting email templates via API:', { 
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const templates = await notificationService.getEmailTemplates();

      reply.status(200).send({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error('Error getting email templates via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to get email templates',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Process scheduled notifications (admin only)
  fastify.post('/process/scheduled', {
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Processing scheduled notifications via API:', { 
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const processedCount = await notificationService.processScheduledNotifications();

      reply.status(200).send({
        success: true,
        message: 'Scheduled notifications processed successfully',
        data: {
          processedCount,
        },
      });
    } catch (error) {
      logger.error('Error processing scheduled notifications via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to process scheduled notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Retry failed notifications (admin only)
  fastify.post('/process/retry-failed', {
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Retrying failed notifications via API:', { 
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const retriedCount = await notificationService.retryFailedNotifications();

      reply.status(200).send({
        success: true,
        message: 'Failed notifications retry completed',
        data: {
          retriedCount,
        },
      });
    } catch (error) {
      logger.error('Error retrying failed notifications via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to retry failed notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Test notification endpoint (for development)
  if (process.env.NODE_ENV === 'development') {
    fastify.post('/test', {
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            templateId: { type: 'string' },
            templateData: { type: 'object' }
          }
        }
      },
      preHandler: [requireAdmin()],
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email, templateId, templateData } = request.body as any;
        
        logger.info('Testing notification via API:', { 
          email, 
          templateId,
          userId: (request.user as AuthenticatedUser)?.id 
        });

        const notifications = await notificationService.sendNotification({
          to: email,
          type: NotificationType.SYSTEM_ALERT,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.NORMAL,
          templateId: templateId || 'order-confirmed',
          templateData: templateData || {
            name: 'Test User',
            orderNumber: 'TEST-123',
            orderDate: new Date().toISOString(),
            orderTotal: '99.99',
            currency: '$',
            items: [
              { name: 'Test Product', quantity: 1, price: '99.99' }
            ],
            orderUrl: 'https://example.com/orders/TEST-123'
          },
          metadata: {
            userId: (request.user as AuthenticatedUser)?.id,
            source: 'test',
            userAgent: request.headers['user-agent'],
            ipAddress: request.ip,
          },
        });

        reply.status(200).send({
          success: true,
          message: 'Test notification sent successfully',
          data: {
            notifications: notifications.map(n => n.toJSON()),
            count: notifications.length,
          },
        });
      } catch (error) {
        logger.error('Error sending test notification via API:', error);
        reply.status(500).send({
          success: false,
          message: 'Failed to send test notification',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }
} 