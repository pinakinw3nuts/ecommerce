import { FastifyInstance } from 'fastify';
import logger from '../utils/logger';
import { combinedAuthGuard } from '../middleware/combinedAuthGuard';
import { roleGuard } from '../middleware/roleGuard';
import { validateRequest } from '../middleware/validateRequest';
import { sendNotification } from '../services/notificationService';
import { getAllTemplates } from '../templates';
import { NotificationEvents } from '../constants';
import { generateTestData } from '../utils/testDataGenerator';
import { z } from 'zod';

/**
 * Test routes for sending test notifications
 * These routes are only available in non-production environments
 */
export async function testRoutes(fastify: FastifyInstance) {
  // Apply combinedAuthGuard to all routes in this plugin
  fastify.addHook('preHandler', combinedAuthGuard);
  
  // Send a test email
  fastify.post('/email', {
    schema: {
      description: 'Send a test email',
      tags: ['Testing'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      body: {
        type: 'object',
        required: ['recipient', 'type'],
        properties: {
          recipient: { 
            type: 'string',
            format: 'email',
            description: 'Email address to send the test notification to'
          },
          type: {
            type: 'string',
            description: 'Notification type to test',
            enum: Object.values(NotificationEvents)
          },
          data: {
            type: 'object',
            description: 'Test data to use for the notification (optional)',
            additionalProperties: true
          },
          priority: {
            type: 'string',
            enum: ['high', 'normal', 'low'],
            default: 'normal',
            description: 'Priority for the test notification'
          }
        }
      },
      response: {
        202: {
          description: 'Test notification queued successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
            type: { type: 'string' },
            recipient: { type: 'string' },
            jobId: { type: 'string' },
            logId: { type: 'string' }
          }
        }
      }
    },
    preHandler: [
      roleGuard(['admin', 'tester']),
      validateRequest({
        body: z.object({
          recipient: z.string().email(),
          type: z.nativeEnum(NotificationEvents),
          data: z.record(z.any()).optional(),
          priority: z.enum(['high', 'normal', 'low']).default('normal')
        })
      })
    ],
    handler: async (request, reply) => {
      const { recipient, type, data = {}, priority } = request.body as {
        recipient: string;
        type: string;
        data?: Record<string, any>;
        priority: 'high' | 'normal' | 'low';
      };
      
      try {
        logger.info(`Sending test ${type} notification to ${recipient}`);
        
        // Convert type to template ID
        const templateId = type.toLowerCase().replace(/_/g, '-');
        
        // Get the template to see what test data we need
        const templates = getAllTemplates();
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
          return reply.status(400).send({
            message: `Template not found for notification type: ${type}`,
            error: 'TEMPLATE_NOT_FOUND'
          });
        }
        
        // Create test data if none was provided
        const testData = Object.keys(data).length > 0 ? data : generateTestData(type as NotificationEvents);
        
        // Send the notification
        const result = await sendNotification({
          type,
          to: recipient,
          templateVars: testData,
          priority,
          metadata: {
            isTest: true,
            source: 'test-api',
            userId: request.user?.id
          },
          source: 'test'
        });
        
        if (!result.success || result.jobIds.length === 0) {
          return reply.status(500).send({
            message: 'Failed to queue test notification',
            error: result.errors?.[0] || 'UNKNOWN_ERROR'
          });
        }
        
        return reply.status(202).send({
          message: 'Test notification queued successfully',
          type,
          recipient,
          jobId: result.jobIds[0],
          logId: result.logIds[0]
        });
      } catch (error) {
        logger.error('Failed to send test notification', {
          error: error instanceof Error ? error.message : 'Unknown error',
          recipient,
          type
        });
        
        return reply.status(500).send({
          message: 'Failed to send test notification',
          error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
        });
      }
    }
  });
  
  // Send test emails for all templates
  fastify.post('/all-templates', {
    schema: {
      description: 'Send test emails for all available templates',
      tags: ['Testing'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['recipient'],
        properties: {
          recipient: { 
            type: 'string',
            format: 'email',
            description: 'Email address to send the test notifications to'
          }
        }
      },
      response: {
        202: {
          description: 'Test notifications queued',
          type: 'object',
          properties: {
            message: { type: 'string' },
            templateCount: { type: 'integer' },
            queuedCount: { type: 'integer' },
            jobIds: { 
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    },
    preHandler: [
      roleGuard(['admin']),
      validateRequest({
        body: z.object({
          recipient: z.string().email()
        })
      })
    ],
    handler: async (request, reply) => {
      const { recipient } = request.body as { recipient: string };
      
      try {
        logger.info(`Sending test emails for all templates to ${recipient}`);
        
        const templates = getAllTemplates();
        const jobIds: string[] = [];
        const logIds: string[] = [];
        const errors: string[] = [];
        
        // Send a test email for each template
        for (const template of templates) {
          try {
            // Convert template ID to notification type
            const type = template.id.toUpperCase().replace(/-/g, '_');
            
            // Skip if not a valid notification type
            if (!Object.values(NotificationEvents).includes(type as NotificationEvents)) {
              logger.warn(`Skipping template ${template.id} - not a valid notification type`);
              continue;
            }
            
            // Generate test data for this template
            const testData = generateTestData(type as NotificationEvents);
            
            // Send the notification
            const result = await sendNotification({
              type: type as NotificationEvents,
              to: recipient,
              templateVars: testData,
              priority: 'normal',
              metadata: {
                isTest: true,
                testAllTemplates: true,
                source: 'test-api',
                userId: request.user?.id
              },
              source: 'test-all-templates'
            });
            
            if (result.success && result.jobIds.length > 0) {
              jobIds.push(...result.jobIds);
              logIds.push(...result.logIds);
            } else if (result.errors) {
              errors.push(...result.errors);
            }
            
            // Add a small delay to avoid overwhelming the queue
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            logger.error(`Failed to queue test email for template ${template.id}`, {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            errors.push(`Template ${template.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        return reply.status(202).send({
          message: `Queued ${jobIds.length} test emails${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
          templateCount: templates.length,
          queuedCount: jobIds.length,
          jobIds,
          ...(errors.length > 0 ? { errors } : {})
        });
      } catch (error) {
        logger.error('Failed to send test emails for all templates', {
          error: error instanceof Error ? error.message : 'Unknown error',
          recipient
        });
        
        return reply.status(500).send({
          message: 'Failed to send test emails for all templates',
          error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
        });
      }
    }
  });
} 