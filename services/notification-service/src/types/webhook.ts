import { z } from 'zod';

/**
 * Base webhook payload interface
 */
export interface WebhookPayload {
  provider?: string;
  event?: string;
  messageId?: string;
  recipient?: string;
  status?: string;
  reason?: string;
  description?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Interface for inject payload to handle type issues when using fastify.inject
 */
export interface InjectPayload {
  provider?: string;
  [key: string]: any;
}

/**
 * SendGrid webhook payload
 */
export interface SendgridWebhookPayload extends WebhookPayload {
  provider: 'sendgrid';
  sg_event_id?: string;
  sg_message_id?: string;
  event: string;
  email: string;
  timestamp: number;
  smtp_id?: string;
  category?: string[];
  [key: string]: any;
}

/**
 * Mailgun webhook payload
 */
export interface MailgunWebhookPayload extends WebhookPayload {
  provider: 'mailgun';
  event: string;
  recipient: string;
  domain: string;
  message_id?: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * AWS SES webhook payload
 */
export interface SesWebhookPayload extends WebhookPayload {
  provider: 'ses';
  eventType: string;
  mail?: {
    messageId?: string;
    destination?: string[];
  };
  bounce?: {
    bounceType?: string;
    bounceSubType?: string;
    bouncedRecipients?: { emailAddress: string }[];
  };
  complaint?: {
    complaintFeedbackType?: string;
    complainedRecipients?: { emailAddress: string }[];
  };
  delivery?: {
    recipients?: string[];
    timestamp?: string;
  };
  [key: string]: any;
}

/**
 * Zod schemas for webhook payloads
 */
export const genericWebhookSchema = z.object({
  provider: z.string().optional(),
  event: z.string().optional(),
  messageId: z.string().optional(),
  recipient: z.string().optional(),
  status: z.string().optional(),
  reason: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
}).passthrough();

export const sendgridWebhookSchema = genericWebhookSchema.extend({
  provider: z.literal('sendgrid').optional(),
  sg_event_id: z.string().optional(),
  sg_message_id: z.string().optional(),
  event: z.string(),
  email: z.string(),
  timestamp: z.number(),
  smtp_id: z.string().optional(),
  category: z.array(z.string()).optional()
}).passthrough();

export const mailgunWebhookSchema = genericWebhookSchema.extend({
  provider: z.literal('mailgun').optional(),
  event: z.string(),
  recipient: z.string(),
  domain: z.string(),
  message_id: z.string().optional(),
  timestamp: z.number().optional()
}).passthrough();

export const sesWebhookSchema = genericWebhookSchema.extend({
  provider: z.literal('ses').optional(),
  eventType: z.string(),
  mail: z.object({
    messageId: z.string().optional(),
    destination: z.array(z.string()).optional()
  }).optional(),
  bounce: z.object({
    bounceType: z.string().optional(),
    bounceSubType: z.string().optional(),
    bouncedRecipients: z.array(z.object({
      emailAddress: z.string()
    })).optional()
  }).optional(),
  complaint: z.object({
    complaintFeedbackType: z.string().optional(),
    complainedRecipients: z.array(z.object({
      emailAddress: z.string()
    })).optional()
  }).optional(),
  delivery: z.object({
    recipients: z.array(z.string()).optional(),
    timestamp: z.string().optional()
  }).optional()
}).passthrough(); 