import { FastifyRequest, FastifyReply } from 'fastify';
import { UserModerationService } from '../services/userModeration.service';
import { LogService } from '../services/log.service';
import logger from '../utils/logger';
import { AdminActionType } from '../entities/AdminActivityLog';

/**
 * Interface for pagination query parameters
 */
interface PaginationQuery {
  limit?: number;
  page?: number;
}

/**
 * Interface for search query parameters
 */
interface SearchQuery extends PaginationQuery {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for user ban parameters
 */
interface BanUserParams {
  id: string;
}

/**
 * Interface for user ban body
 */
interface BanUserBody {
  reason: string;
  notes?: string;
  permanent?: boolean;
  expiresAt?: string;
}

/**
 * Interface for log query parameters
 */
interface LogQuery extends PaginationQuery {
  actionType?: string;
  adminId?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Controller for admin user management endpoints
 */
export class UserController {
  constructor(
    private userModerationService: UserModerationService,
    private logService: LogService
  ) {}

  /**
   * Get all users with filtering and pagination
   * @route GET /api/admin/users
   */
  async getUsers(request: FastifyRequest<{ Querystring: SearchQuery }>, reply: FastifyReply) {
    try {
      const { 
        page = 1, 
        limit = 20,
        search = '',
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = request.query;
      
      // Calculate offset for pagination
      const offset = (page - 1) * limit;
      
      // Build query conditions
      let query = 'SELECT * FROM users WHERE 1=1';
      const params: any[] = [];
      
      // Add search condition if provided
      if (search) {
        query += ` AND (
          email ILIKE $${params.length + 1} OR
          name ILIKE $${params.length + 1} OR
          id::text = $${params.length + 2}
        )`;
        params.push(`%${search}%`, search);
      }
      
      // Add status filter if provided
      if (status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }
      
      // Add sorting
      query += ` ORDER BY ${sortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
      
      // Add pagination
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      // Count total matching users (without pagination)
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM users 
        WHERE 1=1
        ${search ? ` AND (email ILIKE $1 OR name ILIKE $1 OR id::text = $2)` : ''}
        ${status ? ` AND status = $${search ? 3 : 1}` : ''}
      `;
      
      // Execute DB queries (using private database access via service)
      // Note: In a real application, we would modify the services to expose these queries properly
      const users = await this.executeQuery(query, params);
      const [countResult] = await this.executeQuery(
        countQuery, 
        search ? [`%${search}%`, search, ...(status ? [status] : [])] : [...(status ? [status] : [])]
      );
      
      const totalUsers = parseInt(countResult?.total || '0', 10);
      
      // Log the action
      await this.logService.logAdminAction(
        request,
        AdminActionType.USER_VIEW,
        undefined,
        'users',
        { search, status, page, limit }
      );
      
      return reply.status(200).send({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total: totalUsers,
            totalPages: Math.ceil(totalUsers / limit)
          }
        }
      });
    } catch (error: any) {
      logger.error(error, 'Error fetching users');
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  /**
   * Get a specific user by ID
   * @route GET /api/admin/users/:id
   */
  async getUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      
      // Query to get user details
      const query = `
        SELECT u.*, 
          (SELECT COUNT(*) FROM orders WHERE "userId" = u.id) as order_count,
          (SELECT SUM("totalAmount") FROM orders WHERE "userId" = u.id AND status != 'cancelled') as total_spent
        FROM users u
        WHERE u.id = $1
      `;
      
      const [user] = await this.executeQuery(query, [id]);
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          message: `User with ID ${id} not found`
        });
      }
      
      // Log the action
      await this.logService.logAdminAction(
        request,
        AdminActionType.USER_VIEW,
        id,
        'user',
        {}
      );
      
      return reply.status(200).send({
        success: true,
        data: user
      });
    } catch (error: any) {
      logger.error(error, `Error fetching user with ID: ${request.params.id}`);
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch user details'
      });
    }
  }

  /**
   * Ban or suspend a user
   * @route PUT /api/admin/users/:id/ban
   */
  async banUser(
    request: FastifyRequest<{ 
      Params: BanUserParams; 
      Body: BanUserBody 
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { reason, notes, permanent = false, expiresAt } = request.body;
      
      if (!reason) {
        return reply.status(400).send({
          success: false,
          message: 'Reason is required for banning a user'
        });
      }
      
      // Determine if this is a temporary suspension or permanent ban
      if (permanent) {
        // Permanent ban
        const result = await this.userModerationService.banUser(request, {
          userId: id,
          reason,
          notes
        });
        
        return reply.status(200).send({
          success: true,
          message: result.message
        });
      } else {
        // Temporary suspension
        const result = await this.userModerationService.suspendUser(request, {
          userId: id,
          reason,
          notes,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined
        });
        
        return reply.status(200).send({
          success: true,
          message: result.message
        });
      }
    } catch (error: any) {
      logger.error(error, `Error banning/suspending user with ID: ${request.params.id}`);
      return reply.status(500).send({
        success: false,
        message: `Failed to ban/suspend user: ${error.message}`
      });
    }
  }

  /**
   * Unsuspend a user
   * @route PUT /api/admin/users/:id/unsuspend
   */
  async unsuspendUser(
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: { reason: string; notes?: string } 
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { reason, notes } = request.body;
      
      if (!reason) {
        return reply.status(400).send({
          success: false,
          message: 'Reason is required for unsuspending a user'
        });
      }
      
      const result = await this.userModerationService.unsuspendUser(request, {
        userId: id,
        reason,
        notes
      });
      
      return reply.status(200).send({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      logger.error(error, `Error unsuspending user with ID: ${request.params.id}`);
      return reply.status(500).send({
        success: false,
        message: `Failed to unsuspend user: ${error.message}`
      });
    }
  }

  /**
   * Flag a user account
   * @route PUT /api/admin/users/:id/flag
   */
  async flagUser(
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: { flag: string; reason: string } 
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { flag, reason } = request.body;
      
      if (!flag || !reason) {
        return reply.status(400).send({
          success: false,
          message: 'Flag and reason are required'
        });
      }
      
      const result = await this.userModerationService.flagUser(
        request,
        id,
        flag as any, // Cast to UserFlag enum
        reason
      );
      
      return reply.status(200).send({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      logger.error(error, `Error flagging user with ID: ${request.params.id}`);
      return reply.status(500).send({
        success: false,
        message: `Failed to flag user: ${error.message}`
      });
    }
  }

  /**
   * Get admin activity logs
   * @route GET /api/admin/logs
   */
  async getLogs(request: FastifyRequest<{ Querystring: LogQuery }>, reply: FastifyReply) {
    try {
      const { 
        page = 1, 
        limit = 20,
        actionType,
        adminId,
        targetId,
        startDate,
        endDate
      } = request.query;
      
      // Calculate offset for pagination
      const offset = (page - 1) * limit;
      
      // Build search parameters
      const searchParams: any = { 
        limit, 
        offset 
      };
      
      if (actionType) searchParams.actionType = actionType;
      if (adminId) searchParams.adminId = adminId;
      if (targetId) searchParams.targetId = targetId;
      if (startDate) searchParams.startDate = new Date(startDate);
      if (endDate) searchParams.endDate = new Date(endDate);
      
      // Fetch logs using the log service
      const logs = await this.logService.searchLogs(searchParams);
      
      // Get approximate total count for pagination
      // Since we can't directly access logRepository, we'll use searchLogs with a high limit
      // In a real app, we'd modify the LogService to expose a countLogs method
      const allLogs = await this.logService.searchLogs({
        ...searchParams,
        limit: 1000, // Set a high limit to get approximate count
        offset: 0
      });
      
      const totalLogs = allLogs.length;
      
      // Log this action
      await this.logService.logAdminAction(
        request,
        AdminActionType.OTHER,
        undefined,
        'logs',
        { actionType, adminId, targetId, page, limit }
      );
      
      return reply.status(200).send({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total: totalLogs,
            totalPages: Math.ceil(totalLogs / limit)
          }
        }
      });
    } catch (error: any) {
      logger.error(error, 'Error fetching admin logs');
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin logs'
      });
    }
  }

  /**
   * Helper method to execute database queries
   * @private
   */
  private async executeQuery(query: string, params: any[]): Promise<any[]> {
    try {
      // This is a workaround since we can't directly access the private dataSource
      // In a real app, we would modify the service to expose a method for this
      // or use a repository pattern
      return await this.userModerationService['dataSource'].query(query, params);
    } catch (error: any) {
      logger.error(error, 'Error executing database query');
      throw new Error(`Database query failed: ${error.message}`);
    }
  }
} 