import { v4 as uuidv4 } from 'uuid';
import { 
  NotificationLog, 
  CreateNotificationLogInput, 
  UpdateNotificationLogInput, 
  NotificationLogFilters, 
  NotificationLogQueryOptions,
  NotificationStatus
} from '../models/NotificationLog';
import { NotificationLogRepository } from './NotificationLogRepository';

/**
 * In-memory implementation of NotificationLogRepository
 * This is primarily for development and testing
 */
export class InMemoryNotificationLogRepository implements NotificationLogRepository {
  private logs: Map<string, NotificationLog> = new Map();

  async create(data: CreateNotificationLogInput): Promise<NotificationLog> {
    const now = new Date();
    const id = uuidv4();
    
    const log: NotificationLog = {
      id,
      to: data.to,
      type: data.type,
      payload: data.payload,
      status: data.status,
      createdAt: now,
      updatedAt: now,
      sentAt: data.sentAt,
      errorLog: data.errorLog || [],
      retryCount: data.retryCount || 0,
      nextRetryAt: data.nextRetryAt,
      jobId: data.jobId,
      metadata: data.metadata,
    };
    
    this.logs.set(id, log);
    return log;
  }

  async findById(id: string): Promise<NotificationLog | null> {
    return this.logs.get(id) || null;
  }

  async findByJobId(jobId: string): Promise<NotificationLog[]> {
    return Array.from(this.logs.values())
      .filter(log => log.jobId === jobId);
  }

  async update(id: string, data: UpdateNotificationLogInput): Promise<NotificationLog | null> {
    const log = this.logs.get(id);
    if (!log) return null;
    
    const updatedLog: NotificationLog = {
      ...log,
      ...data,
      updatedAt: new Date(),
    };
    
    this.logs.set(id, updatedLog);
    return updatedLog;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.logs.has(id)) return false;
    
    this.logs.delete(id);
    return true;
  }

  async findAll(filters?: NotificationLogFilters, options?: NotificationLogQueryOptions): Promise<NotificationLog[]> {
    let result = Array.from(this.logs.values());
    
    // Apply filters
    if (filters) {
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        result = result.filter(log => statuses.includes(log.status));
      }
      
      if (filters.type) {
        const types = Array.isArray(filters.type) ? filters.type : [filters.type];
        result = result.filter(log => types.includes(log.type));
      }
      
      if (filters.to) {
        result = result.filter(log => log.to === filters.to);
      }
      
      if (filters.createdAtStart) {
        result = result.filter(log => log.createdAt >= filters.createdAtStart!);
      }
      
      if (filters.createdAtEnd) {
        result = result.filter(log => log.createdAt <= filters.createdAtEnd!);
      }
      
      if (filters.sentAtStart) {
        result = result.filter(log => log.sentAt && log.sentAt >= filters.sentAtStart!);
      }
      
      if (filters.sentAtEnd) {
        result = result.filter(log => log.sentAt && log.sentAt <= filters.sentAtEnd!);
      }
      
      if (filters.retryCountMin !== undefined) {
        result = result.filter(log => log.retryCount >= filters.retryCountMin!);
      }
      
      if (filters.retryCountMax !== undefined) {
        result = result.filter(log => log.retryCount <= filters.retryCountMax!);
      }
    }
    
    // Apply sorting
    if (options?.sortBy) {
      const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        const aValue = a[options.sortBy as keyof NotificationLog];
        const bValue = b[options.sortBy as keyof NotificationLog];
        
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortOrder;
        if (bValue === undefined) return -sortOrder;
        
        if (aValue < bValue) return -sortOrder;
        if (aValue > bValue) return sortOrder;
        return 0;
      });
    }
    
    // Apply pagination
    if (options?.page !== undefined && options?.limit !== undefined) {
      const start = (options.page - 1) * options.limit;
      const end = start + options.limit;
      result = result.slice(start, end);
    }
    
    return result;
  }

  async count(filters?: NotificationLogFilters): Promise<number> {
    const logs = await this.findAll(filters);
    return logs.length;
  }

  async findFailedForRetry(limit?: number): Promise<NotificationLog[]> {
    const now = new Date();
    let result = Array.from(this.logs.values()).filter(log => 
      log.status === NotificationStatus.FAILED && 
      (!log.nextRetryAt || log.nextRetryAt <= now)
    );
    
    // Sort by retry count (ascending) and then by creation date (oldest first)
    result.sort((a, b) => {
      if (a.retryCount !== b.retryCount) {
        return a.retryCount - b.retryCount;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    if (limit) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  async updateStatus(id: string, status: NotificationStatus, error?: string): Promise<NotificationLog | null> {
    const log = this.logs.get(id);
    if (!log) return null;
    
    const updatedLog: NotificationLog = {
      ...log,
      status,
      updatedAt: new Date(),
      errorLog: error 
        ? [...(log.errorLog || []), error]
        : log.errorLog
    };
    
    this.logs.set(id, updatedLog);
    return updatedLog;
  }

  async markAsSent(id: string): Promise<NotificationLog | null> {
    const log = this.logs.get(id);
    if (!log) return null;
    
    const now = new Date();
    const updatedLog: NotificationLog = {
      ...log,
      status: NotificationStatus.SENT,
      sentAt: now,
      updatedAt: now,
    };
    
    this.logs.set(id, updatedLog);
    return updatedLog;
  }

  async recordFailedAttempt(id: string, error: string, maxRetries: number, retryDelay: number): Promise<NotificationLog | null> {
    const log = this.logs.get(id);
    if (!log) return null;
    
    const now = new Date();
    const newRetryCount = log.retryCount + 1;
    let status = NotificationStatus.FAILED;
    let nextRetryAt: Date | undefined = undefined;
    
    // If below max retries, schedule for retry
    if (newRetryCount <= maxRetries) {
      status = NotificationStatus.RETRYING;
      nextRetryAt = new Date(now.getTime() + retryDelay * Math.pow(2, newRetryCount - 1)); // Exponential backoff
    }
    
    const updatedLog: NotificationLog = {
      ...log,
      status,
      retryCount: newRetryCount,
      nextRetryAt,
      updatedAt: now,
      errorLog: [...(log.errorLog || []), error],
    };
    
    this.logs.set(id, updatedLog);
    return updatedLog;
  }

  async deleteOldLogs(olderThan: Date, statuses?: NotificationStatus[]): Promise<number> {
    const statusesToDelete = statuses || [
      NotificationStatus.SENT,
      NotificationStatus.CANCELED,
      NotificationStatus.QUEUED,
      NotificationStatus.SENDING,
      NotificationStatus.RETRYING
    ];
    
    const idsToDelete: string[] = [];
    
    for (const [id, log] of this.logs.entries()) {
      if (log.createdAt < olderThan && statusesToDelete.includes(log.status)) {
        idsToDelete.push(id);
      }
    }
    
    for (const id of idsToDelete) {
      this.logs.delete(id);
    }
    
    return idsToDelete.length;
  }
} 