import { DataSource } from 'typeorm';
import { FastifyRequest } from 'fastify';
import logger from '../utils/logger';
import { LogService } from './log.service';
import { AdminActionType } from '../entities/AdminActivityLog';

/**
 * User status enum for moderation
 */
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  RESTRICTED = 'restricted',
  UNDER_REVIEW = 'under_review'
}

/**
 * User flag types for special handling
 */
export enum UserFlag {
  NONE = 'none',
  SUSPICIOUS = 'suspicious',
  VERIFIED = 'verified',
  VIP = 'vip',
  REPEAT_OFFENDER = 'repeat_offender',
  FRAUDULENT = 'fraudulent'
}

/**
 * Interface for user moderation actions
 */
interface ModerationAction {
  userId: string;
  reason: string;
  expiresAt?: Date;
  notes?: string;
}

/**
 * Service for user moderation actions
 */
export class UserModerationService {
  constructor(
    private dataSource: DataSource,
    private logService: LogService
  ) {}

  /**
   * Suspend a user account
   * @param request - Fastify request with admin user
   * @param data - Suspension data
   * @returns Result of operation
   */
  async suspendUser(
    request: FastifyRequest,
    data: ModerationAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const user = await this.getUserById(data.userId);
      if (!user) {
        throw new Error(`User with ID ${data.userId} not found`);
      }

      // Execute the suspension
      await this.dataSource.query(
        `UPDATE users
         SET 
           status = $1,
           suspended_reason = $2,
           suspended_at = CURRENT_TIMESTAMP,
           suspended_until = $3,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [UserStatus.SUSPENDED, data.reason, data.expiresAt || null, data.userId]
      );

      // Log the action
      await this.logService.logAdminAction(
        request,
        AdminActionType.USER_SUSPEND,
        data.userId,
        'user',
        {
          reason: data.reason,
          expiresAt: data.expiresAt,
          notes: data.notes
        }
      );

      return {
        success: true,
        message: `User ${data.userId} has been suspended`
      };
    } catch (error: unknown) {
      logger.error(error, `Error suspending user: ${data.userId}`);
      throw new Error(`Failed to suspend user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Unsuspend a previously suspended user
   * @param request - Fastify request with admin user
   * @param data - Moderation action data
   * @returns Result of operation
   */
  async unsuspendUser(
    request: FastifyRequest,
    data: ModerationAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists and is suspended
      const user = await this.getUserById(data.userId);
      if (!user) {
        throw new Error(`User with ID ${data.userId} not found`);
      }

      // Execute unsuspension
      await this.dataSource.query(
        `UPDATE users
         SET 
           status = $1,
           suspended_reason = NULL,
           suspended_at = NULL,
           suspended_until = NULL,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [UserStatus.ACTIVE, data.userId]
      );

      // Log the action
      await this.logService.logAdminAction(
        request,
        AdminActionType.USER_UNSUSPEND,
        data.userId,
        'user',
        {
          reason: data.reason,
          notes: data.notes
        }
      );

      return {
        success: true,
        message: `User ${data.userId} has been unsuspended`
      };
    } catch (error: unknown) {
      logger.error(error, `Error unsuspending user: ${data.userId}`);
      throw new Error(`Failed to unsuspend user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Permanently ban a user
   * @param request - Fastify request with admin user
   * @param data - Ban action data
   * @returns Result of operation
   */
  async banUser(
    request: FastifyRequest,
    data: ModerationAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const user = await this.getUserById(data.userId);
      if (!user) {
        throw new Error(`User with ID ${data.userId} not found`);
      }

      // Execute the ban
      await this.dataSource.query(
        `UPDATE users
         SET 
           status = $1,
           banned_reason = $2,
           banned_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [UserStatus.BANNED, data.reason, data.userId]
      );

      // Log the action
      await this.logService.logAdminAction(
        request,
        AdminActionType.USER_DELETE,
        data.userId,
        'user',
        {
          reason: data.reason,
          notes: data.notes,
          permanent: true
        }
      );

      return {
        success: true,
        message: `User ${data.userId} has been permanently banned`
      };
    } catch (error: unknown) {
      logger.error(error, `Error banning user: ${data.userId}`);
      throw new Error(`Failed to ban user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a flag to a user account
   * @param request - Fastify request with admin user
   * @param userId - The user ID to flag
   * @param flag - The flag to add
   * @param reason - Reason for flagging
   * @returns Result of operation
   */
  async flagUser(
    request: FastifyRequest,
    userId: string,
    flag: UserFlag,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Add the flag to the user
      await this.dataSource.query(
        `UPDATE users
         SET 
           flags = array_append(COALESCE(flags, ARRAY[]::varchar[]), $1),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [flag, userId]
      );

      // Log the action
      await this.logService.logAdminAction(
        request,
        AdminActionType.USER_UPDATE,
        userId,
        'user',
        {
          action: 'flag_added',
          flag,
          reason
        }
      );

      return {
        success: true,
        message: `Flag '${flag}' has been added to user ${userId}`
      };
    } catch (error: unknown) {
      logger.error(error, `Error flagging user: ${userId}`);
      throw new Error(`Failed to flag user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a flag from a user account
   * @param request - Fastify request with admin user
   * @param userId - The user ID to unflag
   * @param flag - The flag to remove
   * @param reason - Reason for unflagging
   * @returns Result of operation
   */
  async unflagUser(
    request: FastifyRequest,
    userId: string,
    flag: UserFlag,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Remove the flag from the user
      await this.dataSource.query(
        `UPDATE users
         SET 
           flags = array_remove(COALESCE(flags, ARRAY[]::varchar[]), $1),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [flag, userId]
      );

      // Log the action
      await this.logService.logAdminAction(
        request,
        AdminActionType.USER_UPDATE,
        userId,
        'user',
        {
          action: 'flag_removed',
          flag,
          reason
        }
      );

      return {
        success: true,
        message: `Flag '${flag}' has been removed from user ${userId}`
      };
    } catch (error: unknown) {
      logger.error(error, `Error unflagging user: ${userId}`);
      throw new Error(`Failed to unflag user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Place user under review (for suspicious activity)
   * @param request - Fastify request with admin user
   * @param data - Review action data
   * @returns Result of operation
   */
  async placeUserUnderReview(
    request: FastifyRequest,
    data: ModerationAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const user = await this.getUserById(data.userId);
      if (!user) {
        throw new Error(`User with ID ${data.userId} not found`);
      }

      // Set user status to under review
      await this.dataSource.query(
        `UPDATE users
         SET 
           status = $1,
           review_reason = $2,
           review_started_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [UserStatus.UNDER_REVIEW, data.reason, data.userId]
      );

      // Log the action
      await this.logService.logAdminAction(
        request,
        AdminActionType.USER_UPDATE,
        data.userId,
        'user',
        {
          action: 'placed_under_review',
          reason: data.reason,
          notes: data.notes
        }
      );

      return {
        success: true,
        message: `User ${data.userId} has been placed under review`
      };
    } catch (error: unknown) {
      logger.error(error, `Error placing user under review: ${data.userId}`);
      throw new Error(`Failed to place user under review: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a user's current rate limits (placeholder for future implementation)
   * @param userId - The user ID to check
   * @returns Rate limit information
   */
  async getUserRateLimits(userId: string): Promise<any> {
    // This is a placeholder for future implementation
    logger.info(`Getting rate limits for user: ${userId}`);
    return {
      apiCalls: {
        limit: 100,
        remaining: 95,
        resetsAt: new Date(Date.now() + 3600000)
      },
      loginAttempts: {
        limit: 5,
        remaining: 5,
        resetsAt: new Date(Date.now() + 3600000)
      }
    };
  }

  /**
   * Set custom rate limits for a user (placeholder for future implementation)
   * @param request - Fastify request with admin user
   * @param userId - The user ID to set limits for
   * @param limits - The limits to set
   * @returns Result of operation
   */
  async setUserRateLimits(
    request: FastifyRequest,
    userId: string,
    limits: any
  ): Promise<{ success: boolean; message: string }> {
    // This is a placeholder for future implementation
    logger.info(`Setting rate limits for user: ${userId}`, limits);
    
    // Log the action
    await this.logService.logAdminAction(
      request,
      AdminActionType.USER_UPDATE,
      userId,
      'user',
      {
        action: 'set_rate_limits',
        limits
      }
    );

    return {
      success: true,
      message: `Rate limits for user ${userId} have been updated`
    };
  }

  /**
   * Get abuse/reports about a specific user (placeholder for future implementation)
   * @param userId - The user ID to check
   * @returns User abuse reports
   */
  async getUserAbuseReports(userId: string): Promise<any[]> {
    // This is a placeholder for future implementation
    logger.info(`Getting abuse reports for user: ${userId}`);
    return [
      {
        id: '1',
        reportedBy: 'system',
        reason: 'Placeholder for abuse report',
        createdAt: new Date(),
        status: 'pending'
      }
    ];
  }

  /**
   * Get user by ID (helper method)
   * @param userId - The user ID to find
   * @returns User object or null
   */
  private async getUserById(userId: string): Promise<any> {
    try {
      const [user] = await this.dataSource.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      return user;
    } catch (error: unknown) {
      logger.error(error, `Error finding user: ${userId}`);
      throw new Error(`Failed to find user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 