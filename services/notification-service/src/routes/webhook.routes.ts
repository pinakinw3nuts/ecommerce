import { FastifyInstance, FastifyRequest } from 'fastify';
import logger from '../utils/logger';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import * as crypto from 'crypto';
import { NotificationStatus } from '../models/NotificationLog';
import { 
  getNotificationLog, 
  updateNotificationLog, 
  markNotificationAsSent, 
  recordFailedAttempt, 
  queryNotificationLogs
} from '../services/notificationLogService';
import { 
  logNotificationSent, 
  logNotificationFailed 
} from '../services/notificationHistoryService';
import { config } from '../config';
import { WebhookPayload, InjectPayload, genericWebhookSchema, sendgridWebhookSchema, mailgunWebhookSchema, sesWebhookSchema } from '../types/webhook';

type WebhookRequest = FastifyRequest<{
  Body: WebhookPayload,
  Querystring: {
    provider?: string;
  }
}>;

/**
 * Routes for webhook callbacks from email delivery services
 */
export async function webhookRoutes(fastify: FastifyInstance) {
  
  // In development mode, provide a simplified webhook endpoint that just logs requests
  if (config.isDevelopment) {
    logger.debug('Registering simplified webhook routes for development');
    
    // Webhook catch-all endpoint for development
    fastify.post('/email-status', async (request, reply) => {
      logger.info('Received webhook in development mode', {
        body: request.body,
        headers: request.headers
      });
      
      return {
        success: true,
        message: 'Webhook received in development mode'
      };
    });
    
    // SendGrid specific endpoint for development
    fastify.post('/sendgrid', async (request, reply) => {
      logger.info('Received SendGrid webhook in development mode', {
        body: request.body
      });
      
      return {
        success: true,
        message: 'SendGrid webhook received in development mode'
      };
    });
    
    return; // Skip the rest of the routes in development mode
  }
  
  // Webhook endpoint for email delivery status updates
  fastify.post('/email-status', {
    schema: {
      description: 'Webhook for email delivery status updates from email service providers',
      tags: ['Webhooks'],
      body: {
        type: 'object',
        properties: {
          // These properties will vary based on the email service provider
          // This schema is designed to be flexible to accommodate different providers
          event: { type: 'string' },
          messageId: { type: 'string' },
          timestamp: { type: 'string' },
          recipient: { type: 'string' },
          status: { type: 'string' },
          reason: { type: 'string' },
          description: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true },
          provider: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Webhook processed successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    // Validate webhook signature (if available from the provider)
    preHandler: async (request, reply) => {
      try {
        // For security, verify the webhook is from a legitimate source
        // This implementation will vary based on your email provider
        
        // Example for validating a webhook signature (customize based on your provider)
        const signature = request.headers['x-webhook-signature'] as string;
        const webhookSecret = config.email?.webhookSecret;
        
        if (webhookSecret && !validateWebhookSignature(request.body, signature, webhookSecret)) {
          logger.warn('Invalid webhook signature', {
            ip: request.ip,
            headers: request.headers
          });
          
          return reply.status(401).send({
            success: false,
            message: 'Invalid webhook signature'
          });
        }
        
        // Apply schema validation based on the provider
        const provider = getProvider(request as WebhookRequest);
        
        // Select validation schema based on provider
        let validationSchema;
        switch (provider) {
          case 'sendgrid':
            validationSchema = sendgridWebhookSchema;
            break;
          case 'mailgun':
            validationSchema = mailgunWebhookSchema;
            break;
          case 'ses':
            validationSchema = sesWebhookSchema;
            break;
          default:
            validationSchema = genericWebhookSchema;
        }
        
        // Apply validation
        await validateRequest({ body: validationSchema })(request, reply);
      } catch (error) {
        // Validation errors are handled by the validateRequest middleware
        // This catch block handles other errors
        logger.error('Error in webhook validation', {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: request.body
        });
        
        return reply.status(400).send({
          success: false,
          message: 'Invalid webhook payload'
        });
      }
    },
    handler: async (request, reply) => {
      try {
        // Extract data from the webhook payload
        const payload = request.body as WebhookPayload;
        const { event, messageId, recipient, status, reason, description, metadata } = payload;
        const provider = getProvider(request as WebhookRequest);
        
        logger.info('Received email status webhook', {
          provider,
          event,
          messageId,
          recipient,
          status
        });
        
        // Find the notification log entry
        // Try to find by message ID first, then by recipient if needed
        let logEntry = null;
        
        // If we have metadata with a logId, use that first
        if (metadata?.logId) {
          logEntry = await getNotificationLog(metadata.logId);
        }
        
        // If not found and we have a messageId, search by messageId in metadata
        if (!logEntry && messageId) {
          // This would require a specialized query or search functionality
          // For this example, we'll assume the ability to search logs by metadata
          const { logs } = await searchLogsByMetadata('messageId', messageId);
          
          if (logs.length > 0) {
            logEntry = logs[0];
          }
        }
        
        // If still not found and we have a recipient, try to find the most recent log for this recipient
        if (!logEntry && recipient) {
          const { logs } = await queryLogs({ to: recipient }, { limit: 1, sortBy: 'createdAt', sortOrder: 'desc' });
          
          if (logs.length > 0) {
            logEntry = logs[0];
          }
        }
        
        // If we couldn't find a log entry, log a warning and return
        if (!logEntry) {
          logger.warn('Could not find notification log for webhook', {
            provider,
            event,
            messageId,
            recipient
          });
          
          return reply.send({
            success: true,
            message: 'Webhook received, but no matching notification found'
          });
        }
        
        // Process the webhook based on the event/status
        const eventType = normalizeEventType(event || '', status || '', provider);
        
        switch (eventType) {
          case 'delivered':
            // Update the notification log as sent
            await logNotificationSent(logEntry.id, {
              provider,
              messageId,
              deliveredAt: new Date().toISOString(),
              event,
              originalStatus: status
            });
            
            logger.info('Email marked as delivered', {
              logId: logEntry.id,
              recipient,
              messageId
            });
            break;
            
          case 'opened':
          case 'clicked':
            // Update the notification log with engagement data
            await updateNotificationLog(logEntry.id, {
              metadata: {
                ...logEntry.metadata,
                [eventType]: true,
                [`${eventType}At`]: new Date().toISOString(),
                engagement: {
                  ...((logEntry.metadata?.engagement || {}) as Record<string, any>),
                  [eventType]: true
                }
              }
            });
            
            logger.info(`Email ${eventType}`, {
              logId: logEntry.id,
              recipient,
              messageId
            });
            break;
            
          case 'bounced':
          case 'blocked':
          case 'spam-complaint':
            // Record a permanent failure
            await logNotificationFailed(logEntry.id, 
              `Email ${eventType}: ${reason || description || 'No reason provided'}`,
              {
                provider,
                messageId,
                failureType: eventType,
                permanent: true
              }
            );
            
            logger.warn(`Email ${eventType}`, {
              logId: logEntry.id,
              recipient,
              reason: reason || description
            });
            break;
            
          case 'deferred':
          case 'delayed':
            // Record a temporary failure that may be retried
            if (logEntry.status !== NotificationStatus.RETRYING) {
              await logNotificationFailed(logEntry.id, 
                `Email ${eventType}: ${reason || description || 'No reason provided'}`,
                {
                  provider,
                  messageId,
                  failureType: eventType,
                  permanent: false
                }
              );
              
              logger.warn(`Email ${eventType}`, {
                logId: logEntry.id,
                recipient,
                reason: reason || description
              });
            }
            break;
            
          default:
            // For other events, just update the metadata
            await updateNotificationLog(logEntry.id, {
              metadata: {
                ...logEntry.metadata,
                webhookEvents: [
                  ...((logEntry.metadata?.webhookEvents || []) as any[]),
                  {
                    event: eventType,
                    timestamp: new Date().toISOString(),
                    provider,
                    originalEvent: event,
                    originalStatus: status
                  }
                ]
              }
            });
            
            logger.info(`Email event: ${eventType}`, {
              logId: logEntry.id,
              recipient,
              messageId
            });
        }
        
        return reply.send({
          success: true,
          message: 'Webhook processed successfully'
        });
      } catch (error) {
        logger.error('Error processing webhook', {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: request.body
        });
        
        // Always return 200 to prevent the provider from retrying
        // (but with success=false to indicate there was an error)
        return reply.send({
          success: false,
          message: 'Error processing webhook, but acknowledged'
        });
      }
    }
  });
  
  // Webhook endpoint for SendGrid
  fastify.post('/sendgrid', {
    schema: {
      description: 'SendGrid specific webhook for email events',
      tags: ['Webhooks'],
    },
    handler: async (request, reply) => {
      // Forward to the general handler with provider information
      const requestBody = request.body as WebhookPayload | WebhookPayload[];
      request.body = Array.isArray(requestBody) 
        ? requestBody.map(event => ({ ...event, provider: 'sendgrid' }))
        : { ...(requestBody as Record<string, any>), provider: 'sendgrid' };
        
      // If it's an array (SendGrid sends arrays of events), process each one
      if (Array.isArray(request.body)) {
        const results = [];
        
        for (const event of request.body) {
          // Create a new request object for each event
          const eventRequest = {
            ...request,
            body: event
          };
          
          // Process using the main handler
          const result = await fastify.inject({
            method: 'POST',
            url: '/api/webhooks/email-status',
            payload: event as InjectPayload,
            headers: request.headers
          });
          
          results.push(JSON.parse(result.payload));
        }
        
        return reply.send({
          success: true,
          message: 'Processed SendGrid webhook events',
          results
        });
      } else {
        // Redirect to the main handler
        return fastify.inject({
          method: 'POST',
          url: '/api/webhooks/email-status',
          payload: request.body as InjectPayload,
          headers: request.headers
        }).then(res => {
          return reply.code(res.statusCode).send(JSON.parse(res.payload));
        });
      }
    }
  });
  
  // Add more provider-specific endpoints as needed
}

/**
 * Normalize various email event types from different providers to a standard set
 */
function normalizeEventType(event: string, status: string, provider: string): string {
  // Convert to lowercase for easier comparison
  const eventLower = (event || '').toLowerCase();
  const statusLower = (status || '').toLowerCase();
  
  // Check for delivery events
  if (
    eventLower === 'delivered' || 
    eventLower === 'delivery' || 
    statusLower === 'delivered' ||
    eventLower === 'send' && statusLower === 'success'
  ) {
    return 'delivered';
  }
  
  // Check for engagement events
  if (eventLower === 'open' || eventLower === 'opened') {
    return 'opened';
  }
  
  if (eventLower === 'click' || eventLower === 'clicked') {
    return 'clicked';
  }
  
  // Check for failure events
  if (
    eventLower === 'bounce' || 
    eventLower === 'bounced' || 
    statusLower === 'bounced' ||
    statusLower === 'bounce'
  ) {
    return 'bounced';
  }
  
  if (
    eventLower === 'blocked' || 
    statusLower === 'blocked' ||
    eventLower === 'block'
  ) {
    return 'blocked';
  }
  
  if (
    eventLower === 'spam' || 
    eventLower === 'spamreport' || 
    eventLower === 'spam_report' ||
    eventLower.includes('spam') && eventLower.includes('complaint')
  ) {
    return 'spam-complaint';
  }
  
  if (
    eventLower === 'deferred' || 
    statusLower === 'deferred' ||
    eventLower === 'defer'
  ) {
    return 'deferred';
  }
  
  if (
    eventLower === 'delayed' || 
    statusLower === 'delayed' ||
    eventLower === 'delay'
  ) {
    return 'delayed';
  }
  
  if (
    eventLower === 'dropped' || 
    statusLower === 'dropped' ||
    eventLower === 'drop'
  ) {
    return 'dropped';
  }
  
  // If we can't normalize it, return the original event or status
  return eventLower || statusLower;
}

/**
 * Validate a webhook signature (implementation will vary by provider)
 */
function validateWebhookSignature(payload: any, signature?: string, secret?: string): boolean {
  // In development mode, skip signature validation
  if (config.isDevelopment) {
    logger.debug('Skipping webhook signature validation in development mode');
    return true;
  }

  // If no secret is configured, skip signature validation
  if (!secret) return true;
  
  // If no signature is provided but we have a secret, validation fails
  if (!signature) return false;
  
  try {
    // Implementation will vary based on the provider
    // This is a generic implementation that works for many providers
    
    // 1. Get the signature algorithm and value
    // Many providers use a format like 'v1=hash,v2=hash2'
    const parts = signature.split(',');
    let signatureValue = signature;
    
    if (parts.length > 1) {
      // If it's in the format v1=hash, extract just the hash part
      const hashPart = parts.find(p => p.trim().startsWith('v1='));
      if (hashPart) {
        signatureValue = hashPart.split('=')[1];
      }
    }
    
    // 2. Create a payload string to hash
    // Providers may require different formats - this is a common one
    const payloadStr = typeof payload === 'string' 
      ? payload 
      : JSON.stringify(payload);
      
    // 3. Calculate HMAC signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadStr);
    const calculatedSignature = hmac.digest('hex');
    
    // 4. Compare signatures - using a string comparison for this implementation
    // In production, we should use timing-safe comparison, but this is simpler for now
    return calculatedSignature === signatureValue;
  } catch (error) {
    // If anything fails in the verification process, consider it invalid
    logger.error('Error validating webhook signature', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Helper function to search logs by metadata field
 */
async function searchLogsByMetadata(field: string, value: any): Promise<{ logs: any[] }> {
  try {
    // This would be implemented differently based on your database
    // For now, we'll return an empty array and log the attempt
    logger.debug(`Searching logs by metadata ${field}=${value} - not implemented yet`);
    return { logs: [] };
  } catch (error) {
    logger.error(`Error searching logs by metadata ${field}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      field,
      value
    });
    return { logs: [] };
  }
}

/**
 * Helper function to query logs (avoid circular dependencies)
 */
async function queryLogs(filters: any, options: any): Promise<{ logs: any[] }> {
  try {
    return queryNotificationLogs(filters, options);
  } catch (error) {
    logger.error('Error querying logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filters,
      options
    });
    return { logs: [] };
  }
}

/**
 * Get provider from the request (body or query)
 */
function getProvider(request: WebhookRequest): string {
  return (request.body?.provider || request.query?.provider || 'generic') as string;
} 