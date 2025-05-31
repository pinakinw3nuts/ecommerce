import { 
  NotificationLog, 
  CreateNotificationLogInput, 
  UpdateNotificationLogInput, 
  NotificationLogFilters, 
  NotificationLogQueryOptions,
  NotificationStatus
} from '../models/NotificationLog';

/**
 * Interface for NotificationLog repository
 * This defines the contract for any implementation (memory, database, etc.)
 */
export interface NotificationLogRepository {
  /**
   * Create a new notification log entry
   * @param data The log data to create
   * @returns The created notification log
   */
  create(data: CreateNotificationLogInput): Promise<NotificationLog>;

  /**
   * Find a notification log by ID
   * @param id The log ID
   * @returns The notification log or null if not found
   */
  findById(id: string): Promise<NotificationLog | null>;

  /**
   * Find notification logs by job ID
   * @param jobId The queue job ID
   * @returns Array of notification logs with the given job ID
   */
  findByJobId(jobId: string): Promise<NotificationLog[]>;

  /**
   * Update a notification log
   * @param id The log ID
   * @param data The data to update
   * @returns The updated notification log or null if not found
   */
  update(id: string, data: UpdateNotificationLogInput): Promise<NotificationLog | null>;

  /**
   * Delete a notification log
   * @param id The log ID
   * @returns True if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Find all notification logs matching the given filters
   * @param filters Optional filters to apply
   * @param options Optional pagination and sorting options
   * @returns Array of matching notification logs
   */
  findAll(filters?: NotificationLogFilters, options?: NotificationLogQueryOptions): Promise<NotificationLog[]>;

  /**
   * Count notification logs matching the given filters
   * @param filters Optional filters to apply
   * @returns The count of matching logs
   */
  count(filters?: NotificationLogFilters): Promise<number>;

  /**
   * Find failed notification logs that need to be retried
   * @param limit Maximum number of logs to return
   * @returns Array of failed notification logs that should be retried
   */
  findFailedForRetry(limit?: number): Promise<NotificationLog[]>;

  /**
   * Update notification status and related fields
   * @param id The log ID
   * @param status The new status
   * @param error Optional error message to add to the error log
   * @returns The updated notification log or null if not found
   */
  updateStatus(id: string, status: NotificationStatus, error?: string): Promise<NotificationLog | null>;

  /**
   * Mark a notification as sent
   * @param id The log ID
   * @returns The updated notification log or null if not found
   */
  markAsSent(id: string): Promise<NotificationLog | null>;

  /**
   * Record a failed attempt and schedule retry if appropriate
   * @param id The log ID
   * @param error The error message
   * @param maxRetries Maximum number of retry attempts
   * @param retryDelay Delay in milliseconds before the next retry
   * @returns The updated notification log or null if not found
   */
  recordFailedAttempt(id: string, error: string, maxRetries: number, retryDelay: number): Promise<NotificationLog | null>;

  /**
   * Delete old notification logs
   * @param olderThan Delete logs older than this date
   * @param statuses Optional list of statuses to delete (defaults to all except FAILED)
   * @returns The number of deleted logs
   */
  deleteOldLogs(olderThan: Date, statuses?: NotificationStatus[]): Promise<number>;
} 