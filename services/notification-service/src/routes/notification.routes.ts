import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';
import { combinedAuthGuard } from '../middleware/combinedAuthGuard';
import { validateRequest } from '../middleware/validateRequest';
import { NotificationEvents } from '../constants';
import { notificationJobIdSchema, notificationSchemas } from '../schemas/notification.schemas';
import { z } from 'zod';
import { sendNotification } from '../services/notificationService';
import { getNotificationLog } from '../services/notificationLogService';

/**
 * Notification routes
 */
export async function notificationRoutes(fastify: FastifyInstance) {
  // Apply combinedAuthGuard to all routes in this plugin
  fastify.addHook('preHandler', combinedAuthGuard);
  
  // Send a notification
  fastify.post('/send', {
    schema: {
      description: 'Send a notification',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      body: {
        type: 'object',
        required: ['type', 'recipients', 'data'],
        properties: {
          type: { 
            type: 'string',
            description: 'Notification type (e.g., ORDER_CONFIRMED)',
            example: 'ORDER_CONFIRMED'
          },
          recipients: { 
            type: 'array',
            description: 'Array of recipient identifiers (emails, user IDs, etc.)',
            items: { type: 'string' },
            example: ['user@example.com']
          },
          data: { 
            type: 'object',
            description: 'Data specific to the notification type',
            additionalProperties: true
          },
          channel: { 
            type: 'string',
            enum: ['email', 'sms', 'push', 'all'],
            default: 'email',
            description: 'Notification channel'
          },
          priority: { 
            type: 'string',
            enum: ['high', 'normal', 'low'],
            default: 'normal',
            description: 'Notification priority'
          },
          scheduledTime: { 
            type: 'string',
            format: 'date-time',
            description: 'Schedule notification for a future time (ISO-8601 date string)'
          }
        }
      },
      response: {
        202: {
          description: 'Notification queued successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
            jobIds: { 
              type: 'array',
              items: { type: 'string' }
            },
            logIds: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    },
    // Custom preHandler for validating request based on notification type
    preHandler: async (request, reply) => {
      try {
        // First, validate that we have a valid notification type
        const baseSchema = z.object({
          type: z.string().min(1)
        });
        
        const { type } = baseSchema.parse(request.body);
        
        // Check if notification type is valid
        if (!Object.values(NotificationEvents).includes(type as NotificationEvents)) {
          return reply.status(400).send({
            message: 'Invalid notification type',
            error: 'INVALID_NOTIFICATION_TYPE'
          });
        }
        
        // Get the schema for this notification type
        const schema = notificationSchemas[type as keyof typeof notificationSchemas];
        
        if (!schema) {
          return reply.status(400).send({
            message: `Schema not defined for notification type: ${type}`,
            error: 'NOTIFICATION_SCHEMA_NOT_FOUND'
          });
        }
        
        // Apply the schema validation
        await validateRequest({ body: schema })(request, reply);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const validationErrors = error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }));
          
          logger.warn('Notification validation failed', {
            errors: validationErrors
          });
          
          return reply.status(400).send({
            message: 'Validation error',
            error: 'VALIDATION_ERROR',
            details: validationErrors
          });
        }
        
        // Let other errors pass through to the main error handler
        throw error;
      }
    },
    handler: async (request, reply) => {
      const { type, recipients, data, channel = 'email', priority = 'normal', scheduledTime } = request.body as {
        type: string;
        recipients: string[];
        data: Record<string, any>;
        channel?: 'email' | 'sms' | 'push' | 'all';
        priority?: 'high' | 'normal' | 'low';
        scheduledTime?: string;
      };

      try {
        logger.info(`Processing ${type} notification for ${recipients.length} recipients`, {
          type,
          recipientCount: recipients.length,
          channel,
          priority
        });

        const jobIds: string[] = [];
        const logIds: string[] = [];
        const errors: string[] = [];

        // Only handle email channel for now
        if (channel === 'email' || channel === 'all') {
          const result = await sendNotification({
            type,
            to: recipients,
            templateVars: data,
            priority,
            scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
            metadata: {
              userData: data,
              userId: request.user?.id,
              source: 'api'
            },
            source: 'api'
          });

          // Collect results
          jobIds.push(...result.jobIds);
          logIds.push(...result.logIds);
          
          if (result.errors && result.errors.length > 0) {
            errors.push(...result.errors);
          }
        }

        // Add SMS and push implementations here when available

        if (errors.length > 0) {
          logger.warn('Some notifications failed to queue', { errors });
        }

        return reply.status(202).send({
          message: jobIds.length > 0 
            ? 'Notification queued successfully' 
            : 'No notifications were queued',
          jobIds,
          logIds,
          ...(errors.length > 0 ? { errors } : {})
        });
      } catch (error) {
        logger.error('Failed to queue notification', {
          error: error instanceof Error ? error.message : 'Unknown error',
          type,
          recipientCount: recipients.length
        });

        return reply.status(500).send({
          message: 'Failed to queue notification',
          error: 'NOTIFICATION_QUEUE_ERROR'
        });
      }
    }
  });

  // Get notification status
  fastify.get('/status/:jobId', {
    schema: {
      description: 'Get notification status',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      params: {
        type: 'object',
        required: ['jobId'],
        properties: {
          jobId: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Notification status',
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            status: { type: 'string' },
            progress: { type: 'number' },
            result: { type: 'object', additionalProperties: true },
            error: { type: 'string', nullable: true },
            logs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  sentAt: { type: 'string', format: 'date-time', nullable: true },
                  to: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    preHandler: validateRequest({ params: notificationJobIdSchema }),
    handler: async (request, reply) => {
      const { jobId } = request.params as { jobId: string };

      try {
        // Get logs associated with this job ID
        const logs = await getNotificationLogsByJobId(jobId);
        
        if (logs.length === 0) {
          return reply.status(404).send({
            message: 'Notification not found',
            error: 'NOTIFICATION_NOT_FOUND'
          });
        }
        
        // Determine overall status based on log statuses
        const allSent = logs.every(log => log.status === 'sent');
        const anyFailed = logs.some(log => log.status === 'failed');
        const anyRetrying = logs.some(log => log.status === 'retrying');
        const anySending = logs.some(log => log.status === 'sending');
        const anyQueued = logs.some(log => log.status === 'queued');
        
        let status = 'unknown';
        if (allSent) status = 'completed';
        else if (anyFailed && !anyRetrying && !anySending && !anyQueued) status = 'failed';
        else if (anyRetrying) status = 'retrying';
        else if (anySending) status = 'active';
        else if (anyQueued) status = 'waiting';
        
        // Calculate progress
        const totalLogs = logs.length;
        const completedLogs = logs.filter(log => 
          log.status === 'sent' || log.status === 'failed' || log.status === 'canceled'
        ).length;
        
        const progress = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;
        
        // Get the error if any
        const errors = logs
          .filter(log => log.status === 'failed' && log.errorLog && log.errorLog.length > 0)
          .map(log => log.errorLog![log.errorLog!.length - 1]);
        
        return reply.send({
          jobId,
          status,
          progress,
          result: {
            success: status === 'completed',
            timestamp: new Date().toISOString(),
            totalRecipients: totalLogs,
            completedCount: completedLogs
          },
          error: errors.length > 0 ? errors[0] : null,
          logs: logs.map(log => ({
            id: log.id,
            status: log.status,
            createdAt: log.createdAt.toISOString(),
            sentAt: log.sentAt ? log.sentAt.toISOString() : null,
            to: log.to
          }))
        });
      } catch (error) {
        logger.error('Failed to get notification status', {
          error: error instanceof Error ? error.message : 'Unknown error',
          jobId
        });

        return reply.status(500).send({
          message: 'Failed to get notification status',
          error: 'NOTIFICATION_STATUS_ERROR'
        });
      }
    }
  });
}

/**
 * Helper function to get notification logs by job ID
 * This avoids circular dependencies
 */
async function getNotificationLogsByJobId(jobId: string) {
  const { getNotificationLogsByJobId } = await import('../services/notificationLogService');
  return getNotificationLogsByJobId(jobId);
} 