import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { combinedAuthGuard } from '../middleware/combinedAuthGuard';
import { validateRequest } from '../middleware/validateRequest';
import { NotificationEvents } from '../constants';
import { notificationJobIdSchema, notificationSchemas } from '../schemas/notification.schemas';
import { z } from 'zod';
import { sendNotification } from '../services/notificationService';
import { getNotificationLogsByJobId } from '../services/notificationLogService';

/**
 * Interface for send notification request body
 */
interface SendNotificationRequest {
  type: string;
  recipients: string[];
  data: Record<string, any>;
  channel?: 'email' | 'sms' | 'push' | 'all';
  priority?: 'high' | 'normal' | 'low';
  scheduledTime?: string;
}

/**
 * Validate notification type and schema
 */
async function validateNotificationSchema(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  try {
    // First, validate that we have a valid notification type
    const baseSchema = z.object({
      type: z.string().min(1)
    });
    
    const { type } = baseSchema.parse(request.body);
    
    // Check if notification type is valid
    if (!Object.values(NotificationEvents).includes(type as NotificationEvents)) {
      reply.status(400).send({
        message: 'Invalid notification type',
        error: 'INVALID_NOTIFICATION_TYPE'
      });
      return false;
    }
    
    // Get the schema for this notification type
    const schema = notificationSchemas[type as keyof typeof notificationSchemas];
    
    if (!schema) {
      reply.status(400).send({
        message: `Schema not defined for notification type: ${type}`,
        error: 'NOTIFICATION_SCHEMA_NOT_FOUND'
      });
      return false;
    }
    
    // Apply the schema validation
    await validateRequest({ body: schema })(request, reply);
    return true;
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
      
      reply.status(400).send({
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        details: validationErrors
      });
      return false;
    }
    
    // Let other errors pass through to the main error handler
    throw error;
  }
}

/**
 * Handle send notification request
 */
async function handleSendNotification(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { type, recipients, data, channel = 'email', priority = 'normal', scheduledTime } = request.body as SendNotificationRequest;

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

    reply.status(202).send({
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
    
    reply.status(500).send({
      message: 'Failed to queue notification',
      error: 'NOTIFICATION_QUEUE_ERROR'
    });
  }
}

/**
 * Get notification status by job ID
 */
async function handleGetNotificationStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string };
  
  try {
    const logs = await getNotificationLogsByJobId(id);
    
    if (!logs || logs.length === 0) {
      reply.status(404).send({
        message: 'Notification not found',
        error: 'NOTIFICATION_NOT_FOUND'
      });
      return;
    }
    
    reply.send({
      jobId: id,
      logs
    });
  } catch (error) {
    logger.error('Failed to retrieve notification status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId: id
    });
    
    reply.status(500).send({
      message: 'Failed to retrieve notification status',
      error: 'NOTIFICATION_STATUS_ERROR'
    });
  }
}

/**
 * Register notification routes
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
      const isValid = await validateNotificationSchema(request, reply);
      if (!isValid) return reply;
    },
    handler: handleSendNotification
  });
  
  // Get notification status
  fastify.get('/:id', {
    schema: {
      description: 'Get notification status by job ID',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string',
            description: 'Notification job ID'
          }
        }
      },
      response: {
        200: {
          description: 'Notification status',
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            logs: { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  type: { type: 'string' },
                  recipient: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    preHandler: validateRequest({ params: notificationJobIdSchema }),
    handler: handleGetNotificationStatus
  });
} 