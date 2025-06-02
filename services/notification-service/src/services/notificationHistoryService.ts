import { 
  NotificationLog, 
  NotificationStatus,
  CreateNotificationLogInput
} from '../models/NotificationLog';
import { 
  createNotificationLog, 
  updateNotificationLog,
  getNotificationLog,
  markNotificationAsSent,
  recordFailedAttempt,
  queryNotificationLogs
} from './notificationLogService';
import logger from '../utils/logger';

/**
 * Interface for creating a notification history entry
 */
export interface NotificationHistoryInput {
  type: string;
  to: string;
  payload: Record<string, any>;
  jobId?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new notification history entry
 * @param data Notification history data
 * @returns The created notification log
 */
export async function logNotificationQueued(data: NotificationHistoryInput): Promise<NotificationLog> {
  try {
    const logData: CreateNotificationLogInput = {
      to: data.to,
      type: data.type,
      payload: data.payload,
      status: NotificationStatus.QUEUED,
      jobId: data.jobId,
      metadata: data.metadata
    };
    
    const log = await createNotificationLog(logData);
    
    logger.debug('Notification history entry created', { 
      id: log.id,
      type: log.type,
      to: log.to,
      status: log.status
    });
    
    return log;
  } catch (error) {
    logger.error('Failed to create notification history entry', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data
    });
    
    // Create a fallback log entry even if the main operation fails
    try {
      return await createNotificationLog({
        to: data.to,
        type: data.type,
        payload: {
          ...data.payload,
          _error: error instanceof Error ? error.message : 'Unknown error'
        },
        status: NotificationStatus.FAILED,
        errorLog: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: {
          ...data.metadata,
          error: true,
          errorType: 'HISTORY_CREATION_ERROR'
        }
      });
    } catch (fallbackError) {
      logger.error('Failed to create fallback notification history entry', {
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      });
      
      // Rethrow the original error
      throw error;
    }
  }
}

/**
 * Update a notification history entry to indicate sending is in progress
 * @param id Notification log ID
 * @returns The updated notification log
 */
export async function logNotificationSending(id: string): Promise<NotificationLog | null> {
  try {
    const log = await updateNotificationLog(id, {
      status: NotificationStatus.SENDING,
      updatedAt: new Date()
    });
    
    if (log) {
      logger.debug('Notification marked as sending', { id, to: log.to, type: log.type });
    }
    
    return log;
  } catch (error) {
    logger.error('Failed to update notification history to sending status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id
    });
    return null;
  }
}

/**
 * Update a notification history entry to indicate successful delivery
 * @param id Notification log ID
 * @param metadata Optional additional metadata about the delivery
 * @returns The updated notification log
 */
export async function logNotificationSent(id: string, metadata?: Record<string, any>): Promise<NotificationLog | null> {
  try {
    // First update any metadata if provided
    if (metadata) {
      await updateNotificationLog(id, {
        metadata: {
          ...(await getNotificationLog(id))?.metadata,
          ...metadata,
          sentAt: new Date().toISOString()
        }
      });
    }
    
    // Then mark as sent (which updates status, sentAt, and updatedAt)
    const log = await markNotificationAsSent(id);
    
    if (log) {
      logger.debug('Notification marked as sent', { id, to: log.to, type: log.type });
    }
    
    return log;
  } catch (error) {
    logger.error('Failed to update notification history to sent status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id
    });
    return null;
  }
}

/**
 * Update a notification history entry to indicate a delivery failure
 * @param id Notification log ID
 * @param error Error message or details
 * @param metadata Optional additional metadata about the failure
 * @returns The updated notification log
 */
export async function logNotificationFailed(
  id: string, 
  error: string, 
  metadata?: Record<string, any>
): Promise<NotificationLog | null> {
  try {
    // First update any metadata if provided
    if (metadata) {
      await updateNotificationLog(id, {
        metadata: {
          ...(await getNotificationLog(id))?.metadata,
          ...metadata,
          failedAt: new Date().toISOString()
        }
      });
    }
    
    // Then record the failure (which updates status, errorLog, retryCount, nextRetryAt, and updatedAt)
    const log = await recordFailedAttempt(id, error);
    
    if (log) {
      logger.debug('Notification marked as failed', { 
        id, 
        to: log.to, 
        type: log.type,
        error,
        retryCount: log.retryCount,
        willRetry: log.status === NotificationStatus.RETRYING
      });
    }
    
    return log;
  } catch (error) {
    logger.error('Failed to update notification history to failed status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id
    });
    return null;
  }
}

/**
 * Get notification history for a specific recipient
 * @param to Recipient (email, phone, etc.)
 * @param limit Maximum number of history entries to return
 * @returns Array of notification logs for the recipient
 */
export async function getNotificationHistoryForRecipient(
  to: string,
  limit: number = 10
): Promise<NotificationLog[]> {
  try {
    const { logs } = await queryNotificationLogs(
      { to },
      { limit, page: 1, sortBy: 'createdAt', sortOrder: 'desc' }
    );
    
    return logs;
  } catch (error) {
    logger.error('Failed to get notification history for recipient', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to
    });
    return [];
  }
}

/**
 * Get notification history for a specific type
 * @param type Notification type
 * @param limit Maximum number of history entries to return
 * @returns Array of notification logs for the specified type
 */
export async function getNotificationHistoryByType(
  type: string,
  limit: number = 10
): Promise<NotificationLog[]> {
  try {
    const { logs } = await queryNotificationLogs(
      { type },
      { limit, page: 1, sortBy: 'createdAt', sortOrder: 'desc' }
    );
    
    return logs;
  } catch (error) {
    logger.error('Failed to get notification history by type', {
      error: error instanceof Error ? error.message : 'Unknown error',
      type
    });
    return [];
  }
}

/**
 * Get notification delivery statistics
 * @param since Only include notifications after this date
 * @returns Delivery statistics
 */
export async function getNotificationStats(
  since: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default to last 30 days
): Promise<{
  total: number;
  sent: number;
  failed: number;
  pending: number;
  deliveryRate: number;
}> {
  try {
    // Get total count
    const { total } = await queryNotificationLogs(
      { createdAtStart: since },
      { limit: 1, page: 1 }
    );
    
    // Get sent count
    const { total: sent } = await queryNotificationLogs(
      { 
        status: NotificationStatus.SENT,
        createdAtStart: since
      },
      { limit: 1, page: 1 }
    );
    
    // Get failed count
    const { total: failed } = await queryNotificationLogs(
      { 
        status: NotificationStatus.FAILED,
        createdAtStart: since
      },
      { limit: 1, page: 1 }
    );
    
    // Calculate pending (queued, sending, retrying)
    const { total: pending } = await queryNotificationLogs(
      { 
        status: [
          NotificationStatus.QUEUED,
          NotificationStatus.SENDING,
          NotificationStatus.RETRYING
        ],
        createdAtStart: since
      },
      { limit: 1, page: 1 }
    );
    
    // Calculate delivery rate
    const deliveryRate = total > 0 ? (sent / total) * 100 : 0;
    
    return {
      total,
      sent,
      failed,
      pending,
      deliveryRate
    };
  } catch (error) {
    logger.error('Failed to get notification statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      since
    });
    
    // Return zeroed stats on error
    return {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      deliveryRate: 0
    };
  }
} 