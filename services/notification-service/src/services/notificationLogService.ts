import { 
  CreateNotificationLogInput, 
  NotificationLog, 
  NotificationLogFilters, 
  NotificationLogQueryOptions,
  NotificationStatus,
  UpdateNotificationLogInput
} from '../models/NotificationLog';
import { NotificationLogRepository } from '../repositories/NotificationLogRepository';
import { InMemoryNotificationLogRepository } from '../repositories/InMemoryNotificationLogRepository';
import logger from '../utils/logger';
import { config } from '../config';

// Default repository is in-memory, but this could be swapped with a database implementation
const repository: NotificationLogRepository = new InMemoryNotificationLogRepository();

/**
 * Create a new notification log
 */
export async function createNotificationLog(data: CreateNotificationLogInput): Promise<NotificationLog> {
  try {
    const log = await repository.create(data);
    logger.debug('Created notification log', { logId: log.id, type: log.type });
    return log;
  } catch (error) {
    logger.error('Failed to create notification log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data
    });
    throw error;
  }
}

/**
 * Get a notification log by ID
 */
export async function getNotificationLog(id: string): Promise<NotificationLog | null> {
  try {
    return await repository.findById(id);
  } catch (error) {
    logger.error('Failed to get notification log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id
    });
    throw error;
  }
}

/**
 * Get notification logs by job ID
 */
export async function getNotificationLogsByJobId(jobId: string): Promise<NotificationLog[]> {
  try {
    return await repository.findByJobId(jobId);
  } catch (error) {
    logger.error('Failed to get notification logs by job ID', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId
    });
    throw error;
  }
}

/**
 * Update a notification log
 */
export async function updateNotificationLog(id: string, data: UpdateNotificationLogInput): Promise<NotificationLog | null> {
  try {
    const log = await repository.update(id, data);
    if (log) {
      logger.debug('Updated notification log', { logId: id });
    }
    return log;
  } catch (error) {
    logger.error('Failed to update notification log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id,
      data
    });
    throw error;
  }
}

/**
 * Delete a notification log
 */
export async function deleteNotificationLog(id: string): Promise<boolean> {
  try {
    const result = await repository.delete(id);
    if (result) {
      logger.debug('Deleted notification log', { logId: id });
    }
    return result;
  } catch (error) {
    logger.error('Failed to delete notification log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id
    });
    throw error;
  }
}

/**
 * Query notification logs with filters and pagination
 */
export async function queryNotificationLogs(
  filters?: NotificationLogFilters, 
  options?: NotificationLogQueryOptions
): Promise<{ logs: NotificationLog[]; total: number }> {
  try {
    const [logs, total] = await Promise.all([
      repository.findAll(filters, options),
      repository.count(filters)
    ]);
    
    return { logs, total };
  } catch (error) {
    logger.error('Failed to query notification logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filters,
      options
    });
    throw error;
  }
}

/**
 * Mark a notification as sent
 */
export async function markNotificationAsSent(id: string): Promise<NotificationLog | null> {
  try {
    const log = await repository.markAsSent(id);
    if (log) {
      logger.info('Notification marked as sent', { 
        logId: id, 
        to: log.to, 
        type: log.type 
      });
    }
    return log;
  } catch (error) {
    logger.error('Failed to mark notification as sent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id
    });
    throw error;
  }
}

/**
 * Record a failed notification attempt and schedule retry if appropriate
 */
export async function recordFailedAttempt(
  id: string, 
  error: string
): Promise<NotificationLog | null> {
  try {
    const maxRetries = config.notification?.maxRetries || 3;
    const retryDelay = config.notification?.baseRetryDelay || 60000; // 1 minute default
    
    const log = await repository.recordFailedAttempt(id, error, maxRetries, retryDelay);
    
    if (log) {
      if (log.status === NotificationStatus.RETRYING) {
        logger.warn('Notification failed, scheduled for retry', { 
          logId: id, 
          to: log.to, 
          type: log.type,
          retryCount: log.retryCount,
          nextRetryAt: log.nextRetryAt,
          error
        });
      } else {
        logger.error('Notification failed permanently', { 
          logId: id, 
          to: log.to, 
          type: log.type,
          retryCount: log.retryCount,
          error
        });
      }
    }
    
    return log;
  } catch (error) {
    logger.error('Failed to record failed attempt', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id
    });
    throw error;
  }
}

/**
 * Find failed notifications that need to be retried
 */
export async function findFailedNotificationsForRetry(limit?: number): Promise<NotificationLog[]> {
  try {
    return await repository.findFailedForRetry(limit);
  } catch (error) {
    logger.error('Failed to find notifications for retry', {
      error: error instanceof Error ? error.message : 'Unknown error',
      limit
    });
    throw error;
  }
}

/**
 * Delete old notification logs
 */
export async function cleanupOldLogs(days: number = 30): Promise<number> {
  try {
    const now = new Date();
    const olderThan = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const count = await repository.deleteOldLogs(olderThan);
    logger.info(`Deleted ${count} old notification logs`, { olderThan, days });
    
    return count;
  } catch (error) {
    logger.error('Failed to clean up old logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      days
    });
    throw error;
  }
} 