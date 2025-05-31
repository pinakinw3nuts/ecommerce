import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';
import { combinedAuthGuard } from '../middleware/combinedAuthGuard';
import { roleGuard } from '../middleware/roleGuard';
import { validateRequest } from '../middleware/validateRequest';
import {
  queryNotificationLogs,
  getNotificationLog,
  deleteNotificationLog,
  updateNotificationLog,
  cleanupOldLogs,
  recordFailedAttempt,
  findFailedNotificationsForRetry
} from '../services/notificationLogService';
import { getNotificationStats } from '../services/notificationHistoryService';
import { 
  notificationLogIdSchema,
  notificationLogFilterSchema,
  notificationLogSortSchema,
  retryNotificationSchema,
  bulkRetryNotificationsSchema,
  cancelNotificationSchema,
  cleanupNotificationLogsSchema
} from '../schemas/notification-log.schemas';
import { NotificationStatus } from '../models/NotificationLog';
import { queueEmail } from '../queues/emailQueue';
import { z } from 'zod';
import { getTemplate, interpolateTemplate } from '../templates';

/**
 * Routes for notification logs
 */
export async function notificationLogRoutes(fastify: FastifyInstance) {
  // Apply combinedAuthGuard to all routes in this plugin
  fastify.addHook('preHandler', combinedAuthGuard);
  
  // Get all notification logs with filtering and pagination
  fastify.get('/', {
    schema: {
      description: 'Get all notification logs with filtering and pagination',
      tags: ['Notification Logs'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          status: { type: 'string' },
          type: { type: 'string' },
          to: { type: 'string' },
          createdFrom: { type: 'string', format: 'date-time' },
          createdTo: { type: 'string', format: 'date-time' },
          sentFrom: { type: 'string', format: 'date-time' },
          sentTo: { type: 'string', format: 'date-time' },
          retryCountMin: { type: 'integer' },
          retryCountMax: { type: 'integer' },
          jobId: { type: 'string' },
          search: { type: 'string' },
          sortBy: { type: 'string', default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          description: 'List of notification logs',
          type: 'object',
          properties: {
            logs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  to: { type: 'string' },
                  type: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  sentAt: { type: 'string', format: 'date-time', nullable: true },
                  retryCount: { type: 'integer' },
                  nextRetryAt: { type: 'string', format: 'date-time', nullable: true },
                  jobId: { type: 'string', nullable: true }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    // Apply validation and role guard middleware
    preHandler: [
      roleGuard(['admin', 'support']),
      validateRequest({ 
        querystring: z.object({
          ...notificationLogFilterSchema.shape,
          ...notificationLogSortSchema.shape
        })
      })
    ],
    handler: async (request, reply) => {
      try {
        const {
          page = 1,
          limit = 20,
          status,
          type,
          to,
          createdFrom,
          createdTo,
          sentFrom,
          sentTo,
          retryCountMin,
          retryCountMax,
          jobId,
          search,
          sortBy = 'createdAt',
          sortOrder = 'desc'
        } = request.query as any;
        
        // Convert string parameters to proper types
        const filters = {
          status: status ? status as NotificationStatus : undefined,
          type,
          to,
          createdAtStart: createdFrom ? new Date(createdFrom) : undefined,
          createdAtEnd: createdTo ? new Date(createdTo) : undefined,
          sentAtStart: sentFrom ? new Date(sentFrom) : undefined,
          sentAtEnd: sentTo ? new Date(sentTo) : undefined,
          retryCountMin: retryCountMin !== undefined ? Number(retryCountMin) : undefined,
          retryCountMax: retryCountMax !== undefined ? Number(retryCountMax) : undefined,
          jobId
        };
        
        const options = {
          page: Number(page),
          limit: Number(limit),
          sortBy: sortBy as any,
          sortOrder: sortOrder as 'asc' | 'desc'
        };
        
        const { logs, total } = await queryNotificationLogs(filters, options);
        
        // Calculate pagination info
        const pages = Math.ceil(total / limit);
        
        return reply.send({
          logs: logs.map(log => ({
            ...log,
            createdAt: log.createdAt.toISOString(),
            updatedAt: log.updatedAt.toISOString(),
            sentAt: log.sentAt ? log.sentAt.toISOString() : null,
            nextRetryAt: log.nextRetryAt ? log.nextRetryAt.toISOString() : null
          })),
          pagination: {
            total,
            page,
            limit,
            pages
          }
        });
      } catch (error) {
        logger.error('Failed to get notification logs', {
          error: error instanceof Error ? error.message : 'Unknown error',
          query: request.query
        });
        
        return reply.status(500).send({
          message: 'Failed to get notification logs',
          error: 'NOTIFICATION_LOGS_ERROR'
        });
      }
    }
  });
  
  // Get a notification log by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get a notification log by ID',
      tags: ['Notification Logs'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Notification log',
          type: 'object',
          properties: {
            id: { type: 'string' },
            to: { type: 'string' },
            type: { type: 'string' },
            payload: { type: 'object', additionalProperties: true },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            sentAt: { type: 'string', format: 'date-time', nullable: true },
            errorLog: { type: 'array', items: { type: 'string' }, nullable: true },
            retryCount: { type: 'integer' },
            nextRetryAt: { type: 'string', format: 'date-time', nullable: true },
            jobId: { type: 'string', nullable: true },
            metadata: { type: 'object', additionalProperties: true, nullable: true }
          }
        },
        404: {
          description: 'Notification log not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    // Apply validation and role guard middleware
    preHandler: [
      roleGuard(['admin', 'support']),
      validateRequest({ params: notificationLogIdSchema })
    ],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        const log = await getNotificationLog(id);
        
        if (!log) {
          return reply.status(404).send({
            message: 'Notification log not found',
            error: 'NOTIFICATION_LOG_NOT_FOUND'
          });
        }
        
        return reply.send({
          ...log,
          createdAt: log.createdAt.toISOString(),
          updatedAt: log.updatedAt.toISOString(),
          sentAt: log.sentAt ? log.sentAt.toISOString() : null,
          nextRetryAt: log.nextRetryAt ? log.nextRetryAt.toISOString() : null
        });
      } catch (error) {
        logger.error('Failed to get notification log', {
          error: error instanceof Error ? error.message : 'Unknown error',
          id: (request.params as any).id
        });
        
        return reply.status(500).send({
          message: 'Failed to get notification log',
          error: 'NOTIFICATION_LOG_ERROR'
        });
      }
    }
  });
  
  // Delete a notification log
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a notification log',
      tags: ['Notification Logs'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Notification log deleted',
          type: 'object',
          properties: {
            message: { type: 'string' },
            deleted: { type: 'boolean' }
          }
        },
        404: {
          description: 'Notification log not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    // Apply validation and role guard middleware
    preHandler: [
      roleGuard(['admin']),
      validateRequest({ params: notificationLogIdSchema })
    ],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        const deleted = await deleteNotificationLog(id);
        
        if (!deleted) {
          return reply.status(404).send({
            message: 'Notification log not found',
            error: 'NOTIFICATION_LOG_NOT_FOUND'
          });
        }
        
        return reply.send({
          message: 'Notification log deleted successfully',
          deleted: true
        });
      } catch (error) {
        logger.error('Failed to delete notification log', {
          error: error instanceof Error ? error.message : 'Unknown error',
          id: (request.params as any).id
        });
        
        return reply.status(500).send({
          message: 'Failed to delete notification log',
          error: 'NOTIFICATION_LOG_DELETE_ERROR'
        });
      }
    }
  });
  
  // Retry a failed notification
  fastify.post('/retry', {
    schema: {
      description: 'Retry a failed notification',
      tags: ['Notification Logs'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      body: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Notification retry result',
          type: 'object',
          properties: {
            message: { type: 'string' },
            retried: { type: 'boolean' },
            jobId: { type: 'string', nullable: true }
          }
        },
        404: {
          description: 'Notification log not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    // Apply validation and role guard middleware
    preHandler: [
      roleGuard(['admin', 'support']),
      validateRequest({ body: retryNotificationSchema })
    ],
    handler: async (request, reply) => {
      try {
        const { id } = request.body as { id: string };
        
        const log = await getNotificationLog(id);
        
        if (!log) {
          return reply.status(404).send({
            message: 'Notification log not found',
            error: 'NOTIFICATION_LOG_NOT_FOUND'
          });
        }
        
        // Only allow retrying failed notifications
        if (log.status !== NotificationStatus.FAILED) {
          return reply.status(400).send({
            message: `Cannot retry notification with status ${log.status}`,
            error: 'INVALID_STATUS_FOR_RETRY'
          });
        }
        
        // Requeue the notification
        let jobId: string | null = null;
        
        // Currently only supports email
        if (log.type.includes('EMAIL') || log.to.includes('@')) {
          jobId = await queueEmail({
            to: log.to,
            subject: log.payload.subject || `Retried: ${log.type}`,
            html: log.payload.html || `<p>Retried notification of type: ${log.type}</p>`,
            text: log.payload.text,
            priority: 'high',
            metadata: {
              ...log.metadata,
              originalLogId: log.id,
              retried: true,
              retriedAt: new Date().toISOString(),
              retriedBy: request.user.id
            },
            source: 'retry',
            templateId: log.payload.templateId
          });
          
          // Update the original log
          await updateNotificationLog(id, {
            status: NotificationStatus.RETRYING,
            nextRetryAt: new Date(),
            metadata: {
              ...log.metadata,
              retryJobId: jobId,
              retriedAt: new Date(),
              retriedBy: request.user.id
            }
          });
        }
        
        return reply.send({
          message: 'Notification queued for retry',
          retried: true,
          jobId
        });
      } catch (error) {
        logger.error('Failed to retry notification', {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: request.body
        });
        
        return reply.status(500).send({
          message: 'Failed to retry notification',
          error: 'NOTIFICATION_RETRY_ERROR'
        });
      }
    }
  });
  
  // Bulk retry failed notifications
  fastify.post('/retry-bulk', {
    schema: {
      description: 'Retry multiple failed notifications',
      tags: ['Notification Logs'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      body: {
        type: 'object',
        properties: {
          ids: { 
            type: 'array', 
            items: { type: 'string' }, 
            nullable: true 
          },
          status: { 
            type: 'string', 
            enum: Object.values(NotificationStatus), 
            default: NotificationStatus.FAILED 
          },
          limit: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 100, 
            default: 50 
          },
          type: { 
            type: 'string', 
            nullable: true 
          }
        }
      },
      response: {
        200: {
          description: 'Bulk retry result',
          type: 'object',
          properties: {
            message: { type: 'string' },
            retriedCount: { type: 'integer' },
            jobIds: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    // Apply validation and role guard middleware
    preHandler: [
      roleGuard(['admin']),
      validateRequest({ body: bulkRetryNotificationsSchema })
    ],
    handler: async (request, reply) => {
      try {
        const { ids, status = NotificationStatus.FAILED, limit = 50, type } = request.body as {
          ids?: string[];
          status?: NotificationStatus;
          limit?: number;
          type?: string;
        };
        
        const jobIds: string[] = [];
        let logs: any[] = [];
        
        // If IDs are provided, retry those specific notifications
        if (ids && ids.length > 0) {
          for (const id of ids) {
            const log = await getNotificationLog(id);
            if (log && log.status === NotificationStatus.FAILED) {
              logs.push(log);
            }
          }
        } 
        // Otherwise, find failed notifications based on filters
        else {
          logs = await findFailedNotificationsForRetry(limit);
          
          // Apply type filter if specified
          if (type) {
            logs = logs.filter(log => log.type === type);
          }
        }
        
        // Retry each notification
        for (const log of logs) {
          try {
            // Currently only supports email
            if (log.type.includes('EMAIL') || log.to.includes('@')) {
              const jobId = await queueEmail({
                to: log.to,
                subject: log.payload.subject || `Retried: ${log.type}`,
                html: log.payload.html || `<p>Retried notification of type: ${log.type}</p>`,
                text: log.payload.text,
                priority: 'high',
                metadata: {
                  ...log.metadata,
                  originalLogId: log.id,
                  retried: true,
                  retriedAt: new Date().toISOString(),
                  retriedBy: request.user.id,
                  bulkRetry: true
                },
                source: 'bulk-retry',
                templateId: log.payload.templateId
              });
              
              jobIds.push(jobId);
              
              // Update the original log
              await updateNotificationLog(log.id, {
                status: NotificationStatus.RETRYING,
                nextRetryAt: new Date(),
                metadata: {
                  ...log.metadata,
                  retryJobId: jobId,
                  retriedAt: new Date(),
                  retriedBy: request.user.id,
                  bulkRetry: true
                }
              });
            }
          } catch (error) {
            logger.error(`Failed to retry notification ${log.id}`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              logId: log.id
            });
          }
        }
        
        return reply.send({
          message: `Retried ${jobIds.length} notifications`,
          retriedCount: jobIds.length,
          jobIds
        });
      } catch (error) {
        logger.error('Failed to bulk retry notifications', {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: request.body
        });
        
        return reply.status(500).send({
          message: 'Failed to bulk retry notifications',
          error: 'BULK_RETRY_ERROR'
        });
      }
    }
  });
  
  // Cancel a notification
  fastify.post('/cancel', {
    schema: {
      description: 'Cancel a notification',
      tags: ['Notification Logs'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      body: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Notification cancel result',
          type: 'object',
          properties: {
            message: { type: 'string' },
            canceled: { type: 'boolean' }
          }
        },
        404: {
          description: 'Notification log not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    // Apply validation and role guard middleware
    preHandler: [
      roleGuard(['admin', 'support']),
      validateRequest({ body: cancelNotificationSchema })
    ],
    handler: async (request, reply) => {
      try {
        const { id } = request.body as { id: string };
        
        const log = await getNotificationLog(id);
        
        if (!log) {
          return reply.status(404).send({
            message: 'Notification log not found',
            error: 'NOTIFICATION_LOG_NOT_FOUND'
          });
        }
        
        // Only allow canceling notifications that haven't been sent yet
        if (log.status === NotificationStatus.SENT) {
          return reply.status(400).send({
            message: 'Cannot cancel a notification that has already been sent',
            error: 'NOTIFICATION_ALREADY_SENT'
          });
        }
        
        // Update the log status to canceled
        await updateNotificationLog(id, {
          status: NotificationStatus.CANCELED,
          metadata: {
            ...log.metadata,
            canceledAt: new Date(),
            canceledBy: request.user.id
          }
        });
        
        // If the notification has a job ID, try to remove it from the queue
        // This is just a placeholder - actual implementation would depend on the queue system
        if (log.jobId) {
          // Try to remove from queue or mark as canceled
          // emailQueue.remove(log.jobId);
          logger.info(`Attempted to remove job ${log.jobId} from queue`, { logId: id });
        }
        
        return reply.send({
          message: 'Notification canceled successfully',
          canceled: true
        });
      } catch (error) {
        logger.error('Failed to cancel notification', {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: request.body
        });
        
        return reply.status(500).send({
          message: 'Failed to cancel notification',
          error: 'NOTIFICATION_CANCEL_ERROR'
        });
      }
    }
  });
  
  // Clean up old notification logs
  fastify.post('/cleanup', {
    schema: {
      description: 'Clean up old notification logs',
      tags: ['Notification Logs'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      body: {
        type: 'object',
        properties: {
          olderThan: { 
            type: 'integer', 
            default: 30, 
            description: 'Delete logs older than this many days' 
          },
          includeStatuses: { 
            type: 'array', 
            items: { 
              type: 'string', 
              enum: Object.values(NotificationStatus) 
            },
            nullable: true
          },
          excludeStatuses: { 
            type: 'array', 
            items: { 
              type: 'string', 
              enum: Object.values(NotificationStatus) 
            },
            default: [NotificationStatus.FAILED]
          },
          limit: { 
            type: 'integer', 
            default: 1000, 
            minimum: 1, 
            maximum: 10000 
          }
        }
      },
      response: {
        200: {
          description: 'Cleanup result',
          type: 'object',
          properties: {
            message: { type: 'string' },
            deletedCount: { type: 'integer' }
          }
        }
      }
    },
    // Apply validation and role guard middleware
    preHandler: [
      roleGuard(['admin']),
      validateRequest({ body: cleanupNotificationLogsSchema })
    ],
    handler: async (request, reply) => {
      try {
        const { olderThan = 30 } = request.body as {
          olderThan?: number;
        };
        
        const deletedCount = await cleanupOldLogs(olderThan);
        
        return reply.send({
          message: `Deleted ${deletedCount} old notification logs`,
          deletedCount
        });
      } catch (error) {
        logger.error('Failed to clean up notification logs', {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: request.body
        });
        
        return reply.status(500).send({
          message: 'Failed to clean up notification logs',
          error: 'NOTIFICATION_CLEANUP_ERROR'
        });
      }
    }
  });

  // Get notification statistics
  fastify.get('/stats', {
    schema: {
      description: 'Get notification delivery statistics',
      tags: ['Notification Logs'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          days: { 
            type: 'integer', 
            description: 'Get stats for the last N days',
            default: 30,
            minimum: 1,
            maximum: 90
          }
        }
      },
      response: {
        200: {
          description: 'Notification statistics',
          type: 'object',
          properties: {
            total: { type: 'integer' },
            sent: { type: 'integer' },
            failed: { type: 'integer' },
            pending: { type: 'integer' },
            deliveryRate: { type: 'number' }
          }
        }
      }
    },
    // Apply role guard middleware
    preHandler: [
      roleGuard(['admin', 'support'])
    ],
    handler: async (request, reply) => {
      try {
        const { days = 30 } = request.query as { days?: number };
        
        // Calculate the date to filter from
        const since = new Date();
        since.setDate(since.getDate() - days);
        
        const stats = await getNotificationStats(since);
        
        return reply.send(stats);
      } catch (error) {
        logger.error('Failed to get notification statistics', {
          error: error instanceof Error ? error.message : 'Unknown error',
          query: request.query
        });
        
        return reply.status(500).send({
          message: 'Failed to get notification statistics',
          error: 'NOTIFICATION_STATS_ERROR'
        });
      }
    }
  });

  // Add route to retry a failed notification
  fastify.post('/retry/:id', {
    schema: {
      description: 'Retry a failed notification',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string',
            description: 'ID of the notification log to retry'
          }
        }
      },
      response: {
        200: {
          description: 'Notification retry initiated',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            jobId: { type: 'string' }
          }
        },
        404: {
          description: 'Notification log not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Cannot retry notification',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            reason: { type: 'string' }
          }
        }
      }
    },
    preHandler: [
      combinedAuthGuard,
      roleGuard(['admin', 'service'])
    ],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      
      try {
        // Get the notification log
        const log = await getNotificationLog(id);
        
        if (!log) {
          return reply.status(404).send({
            success: false,
            message: `Notification log ${id} not found`
          });
        }
        
        // Check if this notification can be retried
        if (log.status !== NotificationStatus.FAILED && log.status !== NotificationStatus.ERROR) {
          return reply.status(400).send({
            success: false,
            message: 'Cannot retry notification',
            reason: `Current status is ${log.status}, can only retry FAILED or ERROR notifications`
          });
        }
        
        // Get original notification data from the log
        const { to, type, payload } = log;
        
        // Get template info
        const templateId = type.toLowerCase().replace(/_/g, '-');
        const template = getTemplate(templateId);
        
        if (!template) {
          return reply.status(400).send({
            success: false,
            message: 'Cannot retry notification',
            reason: `Template not found for notification type: ${type}`
          });
        }
        
        // Prepare email content for retry
        const subject = payload.subject || interpolateTemplate(template.subject, payload.templateVars || {});
        const html = payload.html || interpolateTemplate(template.html, payload.templateVars || {});
        const text = payload.text || (template.text ? interpolateTemplate(template.text, payload.templateVars || {}) : undefined);
        
        // Update the notification log to show retry attempt
        await updateNotificationLog(id, {
          status: NotificationStatus.RETRYING,
          updatedAt: new Date().toISOString(),
          metadata: {
            ...log.metadata,
            retry: {
              attemptedAt: new Date().toISOString(),
              requestedBy: request.user?.id || 'api',
              previousStatus: log.status
            }
          }
        });
        
        // Queue the email for retry
        const jobId = await queueEmail({
          to,
          subject,
          html,
          text,
          cc: log.metadata?.cc as string[] | undefined,
          bcc: log.metadata?.bcc as string[] | undefined,
          replyTo: log.metadata?.replyTo as string | undefined,
          priority: (log.metadata?.priority as 'high' | 'normal' | 'low') || 'normal',
          metadata: {
            ...(payload.metadata || {}),
            notificationType: type,
            logId: id,
            isRetry: true,
            originalTimestamp: log.createdAt,
            retryTimestamp: new Date().toISOString()
          },
          source: 'retry'
        });
        
        logger.info(`Retrying notification ${id}`, {
          logId: id,
          to,
          type,
          jobId
        });
        
        return reply.send({
          success: true,
          message: 'Notification retry initiated',
          jobId
        });
      } catch (error) {
        logger.error(`Failed to retry notification ${id}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          id
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to retry notification',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Add route to retry all failed notifications within a time range
  fastify.post('/retry-all', {
    schema: {
      description: 'Retry all failed notifications within a time range',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          startDate: { 
            type: 'string', 
            format: 'date-time',
            description: 'Start date for notifications to retry (ISO format)'
          },
          endDate: { 
            type: 'string', 
            format: 'date-time',
            description: 'End date for notifications to retry (ISO format)'
          },
          types: {
            type: 'array',
            items: { type: 'string' },
            description: 'Notification types to retry (optional)'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 50,
            description: 'Maximum number of notifications to retry'
          }
        }
      },
      response: {
        200: {
          description: 'Notifications retry initiated',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            retriedCount: { type: 'integer' },
            jobIds: { 
              type: 'array', 
              items: { type: 'string' } 
            }
          }
        }
      }
    },
    preHandler: [
      combinedAuthGuard,
      roleGuard(['admin'])
    ],
    handler: async (request, reply) => {
      const { startDate, endDate, types, limit = 50 } = request.body as {
        startDate?: string;
        endDate?: string;
        types?: string[];
        limit?: number;
      };
      
      try {
        // Build query filters
        const filters: Record<string, any> = {
          status: [NotificationStatus.FAILED, NotificationStatus.ERROR]
        };
        
        if (startDate) {
          filters.createdAtStart = new Date(startDate).toISOString();
        }
        
        if (endDate) {
          filters.createdAtEnd = new Date(endDate).toISOString();
        }
        
        if (types && types.length > 0) {
          filters.types = types;
        }
        
        // Get failed notifications
        const { logs } = await queryNotificationLogs(filters, {
          limit,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        
        if (logs.length === 0) {
          return reply.send({
            success: true,
            message: 'No failed notifications found to retry',
            retriedCount: 0,
            jobIds: []
          });
        }
        
        // Retry each notification
        const jobIds: string[] = [];
        const errors: Record<string, string> = {};
        
        for (const log of logs) {
          try {
            // Get original notification data from the log
            const { id, to, type, payload } = log;
            
            // Get template info
            const templateId = type.toLowerCase().replace(/_/g, '-');
            const template = getTemplate(templateId);
            
            if (!template) {
              errors[id] = `Template not found for notification type: ${type}`;
              continue;
            }
            
            // Prepare email content for retry
            const subject = payload.subject || interpolateTemplate(template.subject, payload.templateVars || {});
            const html = payload.html || interpolateTemplate(template.html, payload.templateVars || {});
            const text = payload.text || (template.text ? interpolateTemplate(template.text, payload.templateVars || {}) : undefined);
            
            // Update the notification log to show retry attempt
            await updateNotificationLog(id, {
              status: NotificationStatus.RETRYING,
              updatedAt: new Date().toISOString(),
              metadata: {
                ...log.metadata,
                retry: {
                  attemptedAt: new Date().toISOString(),
                  requestedBy: request.user?.id || 'api',
                  previousStatus: log.status,
                  batchRetry: true
                }
              }
            });
            
            // Queue the email for retry
            const jobId = await queueEmail({
              to,
              subject,
              html,
              text,
              cc: log.metadata?.cc as string[] | undefined,
              bcc: log.metadata?.bcc as string[] | undefined,
              replyTo: log.metadata?.replyTo as string | undefined,
              priority: (log.metadata?.priority as 'high' | 'normal' | 'low') || 'normal',
              metadata: {
                ...(payload.metadata || {}),
                notificationType: type,
                logId: id,
                isRetry: true,
                originalTimestamp: log.createdAt,
                retryTimestamp: new Date().toISOString(),
                batchRetry: true
              },
              source: 'retry-batch'
            });
            
            jobIds.push(jobId);
            
            logger.info(`Retrying notification ${id} in batch`, {
              logId: id,
              to,
              type,
              jobId
            });
            
            // Add a small delay to avoid overwhelming the queue
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors[log.id] = errorMessage;
            
            logger.error(`Failed to retry notification ${log.id} in batch`, {
              error: errorMessage,
              id: log.id
            });
          }
        }
        
        return reply.send({
          success: true,
          message: `Retried ${jobIds.length} notifications${Object.keys(errors).length > 0 ? ` (${Object.keys(errors).length} failed)` : ''}`,
          retriedCount: jobIds.length,
          jobIds,
          ...(Object.keys(errors).length > 0 ? { errors } : {})
        });
      } catch (error) {
        logger.error('Failed to retry notifications', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to retry notifications',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });
} 