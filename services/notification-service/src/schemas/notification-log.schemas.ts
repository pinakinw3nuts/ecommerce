import { z } from 'zod';
import { NotificationStatus } from '../models/NotificationLog';
import { createSortSchema, dateRangeSchema, paginationSchema } from '../middleware/validateRequest';

/**
 * Schema for notification log ID parameter
 */
export const notificationLogIdSchema = z.object({
  id: z.string().uuid().describe('Notification log ID')
});

/**
 * Schema for notification log filters
 */
export const notificationLogFilterSchema = z.object({
  status: z.nativeEnum(NotificationStatus).optional()
    .describe('Filter by notification status'),
  type: z.string().optional()
    .describe('Filter by notification type'),
  to: z.string().optional()
    .describe('Filter by recipient'),
  createdFrom: z.string().datetime().optional()
    .describe('Filter by creation date (from)'),
  createdTo: z.string().datetime().optional()
    .describe('Filter by creation date (to)'),
  sentFrom: z.string().datetime().optional()
    .describe('Filter by sent date (from)'),
  sentTo: z.string().datetime().optional()
    .describe('Filter by sent date (to)'),
  retryCountMin: z.coerce.number().int().nonnegative().optional()
    .describe('Filter by minimum retry count'),
  retryCountMax: z.coerce.number().int().nonnegative().optional()
    .describe('Filter by maximum retry count'),
  jobId: z.string().optional()
    .describe('Filter by job ID'),
  search: z.string().optional()
    .describe('Search term to match against recipient or type')
}).merge(paginationSchema);

/**
 * Schema for notification log sorting
 */
export const notificationLogSortSchema = createSortSchema([
  'createdAt',
  'updatedAt',
  'sentAt',
  'retryCount',
  'status',
  'type',
  'to'
]);

/**
 * Schema for retrying a failed notification
 */
export const retryNotificationSchema = z.object({
  id: z.string().uuid().describe('Notification log ID to retry')
});

/**
 * Schema for bulk retrying failed notifications
 */
export const bulkRetryNotificationsSchema = z.object({
  ids: z.array(z.string().uuid()).optional()
    .describe('Array of notification log IDs to retry (if empty, will retry based on filters)'),
  status: z.nativeEnum(NotificationStatus).optional()
    .default(NotificationStatus.FAILED)
    .describe('Filter by status for bulk retry'),
  limit: z.coerce.number().int().positive().max(100).default(50)
    .describe('Maximum number of notifications to retry'),
  type: z.string().optional()
    .describe('Filter by notification type for bulk retry')
});

/**
 * Schema for canceling a notification
 */
export const cancelNotificationSchema = z.object({
  id: z.string().uuid().describe('Notification log ID to cancel')
});

/**
 * Schema for cleanup of old notification logs
 */
export const cleanupNotificationLogsSchema = z.object({
  olderThan: z.coerce.number().int().positive().default(30)
    .describe('Delete logs older than this many days'),
  includeStatuses: z.array(z.nativeEnum(NotificationStatus)).optional()
    .describe('Array of statuses to include in cleanup'),
  excludeStatuses: z.array(z.nativeEnum(NotificationStatus)).optional()
    .default([NotificationStatus.FAILED])
    .describe('Array of statuses to exclude from cleanup'),
  limit: z.coerce.number().int().positive().max(10000).default(1000)
    .describe('Maximum number of logs to delete')
}); 