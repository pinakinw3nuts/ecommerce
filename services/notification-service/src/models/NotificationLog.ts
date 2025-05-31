import { z } from 'zod';

/**
 * Enum for notification statuses
 */
export enum NotificationStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  ERROR = 'error',
  RETRYING = 'retrying',
  CANCELED = 'canceled',
}

/**
 * Interface for the NotificationLog model
 */
export interface NotificationLog {
  id: string;
  to: string; // Recipient (email, phone, etc.)
  type: string; // Notification type from NotificationEvents
  payload: Record<string, any>; // JSON payload containing notification data
  status: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date; // When the notification was successfully sent
  errorLog?: string[]; // Array of error messages if sending failed
  retryCount: number; // Number of retry attempts
  nextRetryAt?: Date; // When to retry next
  jobId?: string; // Reference to queue job ID
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * Zod schema for validating NotificationLog objects
 */
export const notificationLogSchema = z.object({
  id: z.string().uuid(),
  to: z.string().min(1),
  type: z.string().min(1),
  payload: z.record(z.any()),
  status: z.nativeEnum(NotificationStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  sentAt: z.date().optional(),
  errorLog: z.array(z.string()).optional(),
  retryCount: z.number().int().nonnegative(),
  nextRetryAt: z.date().optional(),
  jobId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Type for creating a new notification log entry
 */
export type CreateNotificationLogInput = Omit<
  NotificationLog,
  'id' | 'createdAt' | 'updatedAt' | 'retryCount'
> & {
  retryCount?: number;
};

/**
 * Type for updating a notification log entry
 */
export type UpdateNotificationLogInput = Partial<
  Omit<NotificationLog, 'id' | 'createdAt' | 'updatedAt'>
> & {
  updatedAt?: Date | string;
};

/**
 * Type for filtering notification logs
 */
export type NotificationLogFilters = {
  status?: NotificationStatus | NotificationStatus[];
  type?: string | string[];
  to?: string;
  createdAtStart?: Date;
  createdAtEnd?: Date;
  sentAtStart?: Date;
  sentAtEnd?: Date;
  retryCountMin?: number;
  retryCountMax?: number;
};

/**
 * Type for pagination and sorting options
 */
export type NotificationLogQueryOptions = {
  page?: number;
  limit?: number;
  sortBy?: keyof NotificationLog;
  sortOrder?: 'asc' | 'desc';
}; 