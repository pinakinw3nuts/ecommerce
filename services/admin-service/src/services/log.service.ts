import { DataSource, Repository } from 'typeorm';
import { FastifyRequest } from 'fastify';
import { AdminActivityLog, AdminActionType, CreateActivityLogDto } from '../entities/AdminActivityLog';
import logger from '../utils/logger';
import { User } from '../middlewares/authGuard';

/**
 * Service for logging and retrieving admin activity
 */
export class LogService {
  private logRepository: Repository<AdminActivityLog>;

  constructor(private dataSource: DataSource) {
    this.logRepository = this.dataSource.getRepository(AdminActivityLog);
  }

  /**
   * Create a new activity log entry
   * @param data - Log entry data
   * @returns Created log entry
   */
  async createLog(data: CreateActivityLogDto): Promise<AdminActivityLog> {
    try {
      const newLog = this.logRepository.create(data);
      return await this.logRepository.save(newLog) as AdminActivityLog;
    } catch (error) {
      logger.error(error, 'Error creating activity log');
      throw new Error('Failed to create activity log');
    }
  }

  /**
   * Log admin action with request context
   * @param request - Fastify request with authenticated user
   * @param actionType - Type of action performed
   * @param targetId - ID of the target entity (optional)
   * @param targetType - Type of the target entity (optional)
   * @param meta - Additional metadata about the action (optional)
   * @returns Created log entry
   */
  async logAdminAction(
    request: FastifyRequest,
    actionType: AdminActionType,
    targetId?: string,
    targetType?: string,
    meta?: Record<string, any>
  ): Promise<AdminActivityLog> {
    try {
      const admin = request.user as User;
      
      if (!admin || !admin.id) {
        throw new Error('Cannot log action: No authenticated admin user found');
      }

      // Extract client information
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] as string;
      
      // Create log entry
      return await this.createLog({
        adminId: admin.id,
        actionType,
        targetId,
        targetType,
        meta,
        ipAddress,
        userAgent
      });
    } catch (error) {
      logger.error(error, `Error logging admin action: ${actionType}`);
      throw new Error('Failed to log admin action');
    }
  }

  /**
   * Get recent activity logs
   * @param limit - Number of logs to retrieve
   * @param offset - Pagination offset
   * @returns Array of activity logs
   */
  async getRecentActivity(limit: number = 20, offset: number = 0): Promise<AdminActivityLog[]> {
    try {
      return await this.logRepository.find({
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset
      });
    } catch (error) {
      logger.error(error, 'Error fetching recent activity logs');
      throw new Error('Failed to fetch activity logs');
    }
  }

  /**
   * Get activity logs for a specific admin
   * @param adminId - ID of the admin
   * @param limit - Number of logs to retrieve
   * @param offset - Pagination offset
   * @returns Array of activity logs
   */
  async getAdminActivity(adminId: string, limit: number = 20, offset: number = 0): Promise<AdminActivityLog[]> {
    try {
      return await this.logRepository.find({
        where: { adminId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset
      });
    } catch (error) {
      logger.error(error, `Error fetching activity logs for admin: ${adminId}`);
      throw new Error('Failed to fetch admin activity logs');
    }
  }

  /**
   * Get activity logs for a specific target entity
   * @param targetId - ID of the target entity
   * @param targetType - Type of the target entity (optional)
   * @param limit - Number of logs to retrieve
   * @param offset - Pagination offset
   * @returns Array of activity logs
   */
  async getTargetActivity(
    targetId: string,
    targetType?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<AdminActivityLog[]> {
    try {
      const where: any = { targetId };
      
      if (targetType) {
        where.targetType = targetType;
      }
      
      return await this.logRepository.find({
        where,
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset
      });
    } catch (error) {
      logger.error(error, `Error fetching activity logs for target: ${targetId}`);
      throw new Error('Failed to fetch target activity logs');
    }
  }

  /**
   * Get activity logs by action type
   * @param actionType - Type of action
   * @param limit - Number of logs to retrieve
   * @param offset - Pagination offset
   * @returns Array of activity logs
   */
  async getActionTypeActivity(
    actionType: AdminActionType,
    limit: number = 20,
    offset: number = 0
  ): Promise<AdminActivityLog[]> {
    try {
      return await this.logRepository.find({
        where: { actionType },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset
      });
    } catch (error) {
      logger.error(error, `Error fetching activity logs for action type: ${actionType}`);
      throw new Error('Failed to fetch action type activity logs');
    }
  }

  /**
   * Search activity logs
   * @param search - Search parameters
   * @returns Array of matching activity logs
   */
  async searchLogs(search: {
    adminId?: string;
    actionType?: AdminActionType;
    targetId?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AdminActivityLog[]> {
    try {
      const {
        adminId,
        actionType,
        targetId,
        targetType,
        startDate,
        endDate,
        limit = 20,
        offset = 0
      } = search;
      
      // Build query conditions
      const where: any = {};
      
      if (adminId) where.adminId = adminId;
      if (actionType) where.actionType = actionType;
      if (targetId) where.targetId = targetId;
      if (targetType) where.targetType = targetType;
      
      // Date range condition
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }
      
      return await this.logRepository.find({
        where,
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset
      });
    } catch (error) {
      logger.error(error, 'Error searching activity logs');
      throw new Error('Failed to search activity logs');
    }
  }
} 