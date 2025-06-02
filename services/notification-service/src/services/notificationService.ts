import { queueEmail } from '../queues/emailQueue';
import logger from '../utils/logger';
import { NotificationEvents } from '../constants';
import { NotificationStatus } from '../models/NotificationLog';
import { templates } from '../templates';
import { logNotificationQueued } from './notificationHistoryService';

/**
 * Interface for notification options
 */
export interface NotificationOptions {
  // Common notification fields
  type: string;
  to: string | string[];
  templateVars?: Record<string, any>;
  
  // Optional fields
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
  scheduledTime?: Date;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  metadata?: Record<string, any>;
  source?: string;
}

/**
 * Result of a notification send operation
 */
export interface NotificationResult {
  success: boolean;
  jobIds: string[];
  errors?: string[];
  logIds: string[];
}

/**
 * Send a notification
 * @param options Notification options
 * @returns Result of the notification operation
 */
export async function sendNotification(options: NotificationOptions): Promise<NotificationResult> {
  const { type, to, templateVars = {}, priority = 'normal', source = 'api' } = options;
  
  // Validate notification type
  if (!Object.values(NotificationEvents).includes(type as NotificationEvents)) {
    throw new Error(`Invalid notification type: ${type}`);
  }
  
  // Get template configuration
  const templateId = type.toLowerCase().replace(/_/g, '-');
  const template = templates[templateId];
  
  if (!template) {
    throw new Error(`Template not found for notification type: ${type}`);
  }
  
  // Convert single recipient to array
  const recipients = Array.isArray(to) ? to : [to];
  
  // Validate recipients
  if (recipients.length === 0) {
    throw new Error('At least one recipient is required');
  }
  
  // Initialize result
  const result: NotificationResult = {
    success: true,
    jobIds: [],
    errors: [],
    logIds: []
  };
  
  // Process each recipient
  for (const recipient of recipients) {
    try {
      // Prepare email content
      // In a real implementation, this would use the template engine to render the template
      // For this implementation, we're using a simplified approach
      const subject = interpolateTemplate(template.subject, templateVars);
      const html = interpolateTemplate(template.html, templateVars);
      const text = template.text ? interpolateTemplate(template.text, templateVars) : undefined;
      
      // Create payload for the notification log
      const payload = {
        templateVars,
        subject,
        html,
        text,
        ...(options.metadata || {})
      };
      
      // Create metadata for the notification log
      const metadata = {
        source,
        priority,
        scheduledTime: options.scheduledTime?.toISOString(),
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        hasAttachments: options.attachments ? true : false
      };
      
      // Log the notification in the history first
      const logEntry = await logNotificationQueued({
        to: recipient,
        type,
        payload,
        metadata
      });
      
      result.logIds.push(logEntry.id);
      
      // Queue the email
      const jobId = await queueEmail({
        to: recipient,
        subject,
        html,
        text,
        cc: Array.isArray(options.cc) ? options.cc : options.cc ? [options.cc] : undefined,
        bcc: Array.isArray(options.bcc) ? options.bcc : options.bcc ? [options.bcc] : undefined,
        replyTo: options.replyTo,
        attachments: options.attachments,
        priority,
        scheduledTime: options.scheduledTime,
        metadata: {
          ...options.metadata,
          notificationType: type,
          logId: logEntry.id
        },
        source,
        templateId
      });
      
      // Update log with job ID
      await updateLogWithJobId(logEntry.id, jobId);
      
      // Add job ID to result
      result.jobIds.push(jobId);
      
      logger.info(`Notification queued for ${recipient}`, {
        type,
        recipient,
        jobId,
        logId: logEntry.id
      });
    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors?.push(`Failed to queue notification for ${recipient}: ${errorMessage}`);
      
      logger.error(`Failed to queue notification for ${recipient}`, {
        type,
        recipient,
        error: errorMessage
      });
    }
  }
  
  return result;
}

/**
 * Send an email notification
 * This is a convenience wrapper around sendNotification specifically for emails
 */
export async function sendEmailNotification(options: NotificationOptions): Promise<NotificationResult> {
  return sendNotification(options);
}

/**
 * Update a notification log with the job ID after queueing
 */
async function updateLogWithJobId(logId: string, jobId: string): Promise<void> {
  const { updateNotificationLog } = await import('./notificationLogService');
  await updateNotificationLog(logId, {
    jobId,
    status: NotificationStatus.QUEUED
  });
}

/**
 * Simple template interpolation function
 * In a real implementation, this would use a more sophisticated template engine
 */
function interpolateTemplate(template: string, vars: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }
  
  return result;
} 