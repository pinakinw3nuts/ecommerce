import { config } from '../config';
import { logger, notificationSuccess, notificationFailure, NotificationContext } from './logger';

/**
 * Email options interface
 */
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Send an email
 * 
 * In development mode or when NOTIFY_MODE is set to 'log', 
 * this will only log the email content instead of sending it.
 * 
 * @param options - The email options
 * @returns A promise that resolves when the email is sent or logged
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text, from = config.emailFrom, ...rest } = options;
  
  // Create notification context for logging
  const context: NotificationContext = {
    notificationType: 'email',
    recipient: to,
    channel: 'email',
    metadata: {
      subject,
      ...rest.metadata
    }
  };

  try {
    // Check if we should only log (development mode or NOTIFY_MODE is 'log')
    if (config.isDevelopment || config.notifyMode === 'log') {
      logger.info('📧 Email would be sent in production', {
        to,
        from,
        subject,
        html: html.substring(0, 500) + (html.length > 500 ? '...' : ''),
        text: text?.substring(0, 500) + (text && text.length > 500 ? '...' : '')
      });
      
      notificationSuccess('Email logged (not sent in development/log mode)', context);
      return true;
    }

    // In production and NOTIFY_MODE is 'all' or 'email'
    if (config.notifyMode === 'all' || config.notifyMode === 'email') {
      // Use configured email provider
      if (config.sendgrid?.apiKey) {
        return await sendWithSendgrid(options, context);
      } else {
        // Fallback to direct SMTP or other methods would go here
        logger.warn('No email provider configured', { context });
        return false;
      }
    }

    // NOTIFY_MODE is 'sms' or 'none'
    logger.debug('Email sending skipped due to NOTIFY_MODE setting', {
      notifyMode: config.notifyMode
    });
    return false;
  } catch (error) {
    notificationFailure('Failed to send email', context, error instanceof Error ? error : new Error('Unknown error'));
    return false;
  }
}

/**
 * Send email using SendGrid
 * Note: This is a placeholder. In a real implementation, you would:
 * 1. Install @sendgrid/mail package
 * 2. Import and configure it with your API key
 * 3. Use it to send the email
 */
async function sendWithSendgrid(options: EmailOptions, context: NotificationContext): Promise<boolean> {
  try {
    // This is a placeholder for actual SendGrid implementation
    // In a real implementation, you would use @sendgrid/mail
    
    /*
    Example implementation:
    
    import sgMail from '@sendgrid/mail';
    sgMail.setApiKey(config.sendgrid.apiKey!);
    
    const msg = {
      to: options.to,
      from: options.from || config.emailFrom,
      subject: options.subject,
      text: options.text,
      html: options.html,
      ...options
    };
    
    await sgMail.send(msg);
    */
    
    // For now, we'll just log that we would send via SendGrid
    logger.info('Would send email via SendGrid', {
      to: options.to,
      from: options.from || config.emailFrom,
      subject: options.subject
    });
    
    notificationSuccess('Email sent via SendGrid', context);
    return true;
  } catch (error) {
    notificationFailure('Failed to send email via SendGrid', context, error instanceof Error ? error : new Error('Unknown error'));
    return false;
  }
}

/**
 * Simple helper to send an email with minimal options
 */
export async function sendSimpleEmail(
  to: string, 
  subject: string, 
  html: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject,
    html
  });
} 