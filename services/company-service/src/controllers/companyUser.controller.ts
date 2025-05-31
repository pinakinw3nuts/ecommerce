import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CompanyUserService } from '../services/companyUser.service';
import { CompanyService } from '../services/company.service';
import { validateRequest, ValidateTarget } from '../middlewares/validateRequest';
import { authGuard, RequestUser } from '../middlewares/authGuard';
import logger from '../utils/logger';
import { CompanyRole, COMPANY_ROLES } from '../constants/roles';

// Schema for adding a team member
const addTeamMemberSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(COMPANY_ROLES as [string, ...string[]]),
  email: z.string().email().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  permissions: z.object({
    canManageUsers: z.boolean().optional(),
    canViewReports: z.boolean().optional(),
    canApproveOrders: z.boolean().optional(),
    orderApprovalLimit: z.number().optional(),
    canManageProducts: z.boolean().optional()
  }).optional()
});

// Schema for updating user role
const updateRoleSchema = z.object({
  role: z.enum(COMPANY_ROLES as [string, ...string[]]),
  permissions: z.object({
    canManageUsers: z.boolean().optional(),
    canViewReports: z.boolean().optional(),
    canApproveOrders: z.boolean().optional(),
    orderApprovalLimit: z.number().optional(),
    canManageProducts: z.boolean().optional()
  }).optional()
});

// Schema for company ID in params
const companyIdParamsSchema = z.object({
  companyId: z.string().uuid()
});

// Schema for company user ID params
const companyUserIdParamsSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.string().uuid()
});

// Schema for team member query filters
const teamMembersQuerySchema = z.object({
  role: z.enum(COMPANY_ROLES as [string, ...string[]]).optional(),
  isActive: z.string().transform(val => val === 'true').optional()
});

// Schema for user removal
const removeUserSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.string().uuid()
});

export class CompanyUserController {
  constructor(
    private companyUserService: CompanyUserService,
    private companyService: CompanyService
  ) {}

  /**
   * Register public routes (no auth required)
   */
  async registerPublicRoutes(_fastify: FastifyInstance): Promise<void> {
    // No public endpoints for company users
  }

  /**
   * Register protected routes (auth required)
   */
  async registerProtectedRoutes(fastify: FastifyInstance): Promise<void> {
    // Get all users in a company
    fastify.get(
      '/:companyId/users',
      { 
        preHandler: [
          authGuard,
          validateRequest(companyIdParamsSchema, ValidateTarget.PARAMS),
          validateRequest(teamMembersQuerySchema, ValidateTarget.QUERY),
          this.checkCompanyAccess.bind(this)
        ]
      },
      this.getTeamMembers.bind(this)
    );

    // Add a team member to a company
    fastify.post(
      '/users',
      { 
        preHandler: [
          authGuard,
          validateRequest(addTeamMemberSchema, ValidateTarget.BODY),
          this.checkAdminOrOwnerAccess.bind(this)
        ]
      },
      this.addTeamMember.bind(this)
    );

    // Remove a user from a company
    fastify.delete(
      '/users',
      { 
        preHandler: [
          authGuard,
          validateRequest(removeUserSchema, ValidateTarget.BODY),
          this.checkAdminOrOwnerAccess.bind(this)
        ]
      },
      this.removeTeamMember.bind(this)
    );

    // Update a team member's role
    fastify.put(
      '/:companyId/users/:userId/role',
      { 
        preHandler: [
          authGuard,
          validateRequest(companyUserIdParamsSchema, ValidateTarget.PARAMS),
          validateRequest(updateRoleSchema, ValidateTarget.BODY),
          this.checkAdminOrOwnerAccess.bind(this)
        ]
      },
      this.updateTeamMemberRole.bind(this)
    );

    // Accept an invitation to join a company
    fastify.post(
      '/invitation/accept',
      { 
        preHandler: [
          authGuard,
          validateRequest(z.object({ token: z.string() }), ValidateTarget.BODY)
        ]
      },
      this.acceptInvitation.bind(this)
    );

    // Resend an invitation
    fastify.post(
      '/:companyId/users/:userId/resend-invitation',
      { 
        preHandler: [
          authGuard,
          validateRequest(companyUserIdParamsSchema, ValidateTarget.PARAMS),
          this.checkAdminOrOwnerAccess.bind(this)
        ]
      },
      this.resendInvitation.bind(this)
    );
  }

  /**
   * Get all team members in a company
   */
  async getTeamMembers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { companyId } = request.params as z.infer<typeof companyIdParamsSchema>;
      const query = request.query as z.infer<typeof teamMembersQuerySchema>;
      
      const teamMembers = await this.companyUserService.getTeamMembers(companyId, {
        role: query.role as CompanyRole | undefined,
        isActive: query.isActive
      });
      
      reply.code(200).send({
        success: true,
        data: teamMembers
      });
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error fetching team members');
      
      reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch team members',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Add a team member to a company
   */
  async addTeamMember(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userData = request.body as z.infer<typeof addTeamMemberSchema>;
      const user = request.user as RequestUser;
      const addedByUserId = user.id;
      
      const companyUser = await this.companyUserService.addTeamMember(
        userData.companyId,
        addedByUserId,
        {
          userId: userData.userId,
          role: userData.role as CompanyRole,
          title: userData.title,
          department: userData.department,
          email: userData.email
        }
      );
      
      reply.code(201).send({
        success: true,
        message: 'Team member added successfully',
        data: {
          id: companyUser.id,
          userId: companyUser.userId,
          companyId: companyUser.companyId,
          role: companyUser.role
        }
      });
    } catch (error: any) {
      logger.error({ error, body: request.body }, 'Error adding team member');
      
      reply.code(error.message?.includes('already belongs') ? 409 : 500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add team member',
        error: error.message?.includes('already belongs') ? 'DUPLICATE_USER' : 'SERVER_ERROR'
      });
    }
  }

  /**
   * Remove a team member from a company
   */
  async removeTeamMember(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { companyId, userId } = request.body as z.infer<typeof removeUserSchema>;
      const user = request.user as RequestUser;
      const removedByUserId = user.id;
      
      // Check if trying to remove self
      if (userId === removedByUserId) {
        // Allow self-removal only if not the last owner
        const teamMembers = await this.companyUserService.getTeamMembers(companyId, { role: CompanyRole.OWNER });
        if (teamMembers.length <= 1 && teamMembers.some(tm => tm.userId === userId && tm.role === CompanyRole.OWNER)) {
          return reply.code(403).send({
            success: false,
            message: 'Cannot remove yourself as the last company owner',
            error: 'FORBIDDEN'
          });
        }
      }
      
      const result = await this.companyUserService.removeTeamMember(
        companyId,
        removedByUserId,
        userId
      );
      
      reply.code(200).send({
        success: result,
        message: result ? 'Team member removed successfully' : 'Failed to remove team member'
      });
    } catch (error: any) {
      logger.error({ error, body: request.body }, 'Error removing team member');
      
      reply.code(error.message?.includes('last company owner') ? 403 : 500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove team member',
        error: error.message?.includes('last company owner') ? 'FORBIDDEN' : 'SERVER_ERROR'
      });
    }
  }

  /**
   * Update a team member's role
   */
  async updateTeamMemberRole(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { companyId, userId } = request.params as z.infer<typeof companyUserIdParamsSchema>;
      const { role, permissions } = request.body as z.infer<typeof updateRoleSchema>;
      const user = request.user as RequestUser;
      const updatedByUserId = user.id;
      
      // Check if trying to update self from owner to non-owner
      if (userId === updatedByUserId && role !== CompanyRole.OWNER) {
        // Check if last owner
        const teamMembers = await this.companyUserService.getTeamMembers(companyId, { role: CompanyRole.OWNER });
        if (teamMembers.length <= 1 && teamMembers.some(tm => tm.userId === userId)) {
          return reply.code(403).send({
            success: false,
            message: 'Cannot change your role as the last company owner',
            error: 'FORBIDDEN'
          });
        }
      }
      
      const updatedUser = await this.companyUserService.updateTeamMemberRole(
        companyId,
        updatedByUserId,
        userId,
        role as CompanyRole,
        permissions
      );
      
      reply.code(200).send({
        success: true,
        message: 'Team member role updated successfully',
        data: {
          userId: updatedUser.userId,
          companyId: updatedUser.companyId,
          role: updatedUser.role,
          permissions: updatedUser.permissions
        }
      });
    } catch (error: any) {
      logger.error({ error, params: request.params, body: request.body }, 'Error updating team member role');
      
      const statusCode = error.message?.includes('Cannot change role') || 
                         error.message?.includes('Only an owner') ? 403 : 500;
      
      reply.code(statusCode).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update team member role',
        error: statusCode === 403 ? 'FORBIDDEN' : 'SERVER_ERROR'
      });
    }
  }

  /**
   * Accept an invitation to join a company
   */
  async acceptInvitation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { token } = request.body as { token: string };
      const user = request.user as RequestUser;
      const userId = user.id;
      
      const companyUser = await this.companyUserService.acceptInvitation(token, userId);
      
      reply.code(200).send({
        success: true,
        message: 'Invitation accepted successfully',
        data: {
          companyId: companyUser.companyId,
          role: companyUser.role
        }
      });
    } catch (error: any) {
      logger.error({ error, body: request.body }, 'Error accepting invitation');
      
      const statusCode = error.message?.includes('Invalid or expired') ? 400 : 500;
      
      reply.code(statusCode).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to accept invitation',
        error: statusCode === 400 ? 'INVALID_TOKEN' : 'SERVER_ERROR'
      });
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { companyId, userId } = request.params as z.infer<typeof companyUserIdParamsSchema>;
      const user = request.user as RequestUser;
      const requestedByUserId = user.id;
      
      const companyUser = await this.companyUserService.resendInvitation(
        companyId,
        requestedByUserId,
        userId
      );
      
      reply.code(200).send({
        success: true,
        message: 'Invitation resent successfully',
        data: {
          companyId: companyUser.companyId,
          userId: companyUser.userId,
          invitationExpiry: companyUser.invitationExpiry
        }
      });
    } catch (error: any) {
      logger.error({ error, params: request.params }, 'Error resending invitation');
      
      const statusCode = error.message?.includes('already accepted') ? 400 : 500;
      
      reply.code(statusCode).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to resend invitation',
        error: statusCode === 400 ? 'ALREADY_ACCEPTED' : 'SERVER_ERROR'
      });
    }
  }

  /**
   * Middleware to check if user has access to a company
   */
  async checkCompanyAccess(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Get companyId from params or body
      const params = request.params as Record<string, any>;
      const body = request.body as Record<string, any>;
      const companyId = params?.companyId || body?.companyId;
      
      if (!companyId) {
        return reply.code(400).send({
          success: false,
          message: 'Company ID is required',
          error: 'MISSING_COMPANY_ID'
        });
      }
      
      const user = request.user as RequestUser;
      const userId = user.id;
      
      // Skip check for admin users
      if (user.role === 'ADMIN') {
        return;
      }
      
      const hasAccess = await this.checkUserCompanyAccess(userId, companyId);
      
      if (!hasAccess) {
        reply.code(403).send({
          success: false,
          message: 'You do not have access to this company',
          error: 'FORBIDDEN'
        });
      }
    } catch (error) {
      logger.error({ error, params: request.params, body: request.body }, 'Error checking company access');
      
      reply.code(500).send({
        success: false,
        message: 'Server error checking company access',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Middleware to check if user has admin or owner access to a company
   */
  async checkAdminOrOwnerAccess(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Get companyId from params or body
      const params = request.params as Record<string, any>;
      const body = request.body as Record<string, any>;
      const companyId = params?.companyId || body?.companyId;
      
      if (!companyId) {
        return reply.code(400).send({
          success: false,
          message: 'Company ID is required',
          error: 'MISSING_COMPANY_ID'
        });
      }
      
      const user = request.user as RequestUser;
      const userId = user.id;
      
      // Skip check for global admin users
      if (user.role === 'ADMIN') {
        return;
      }
      
      // Check if user is company owner or admin
      const companyUser = await this.companyUserService.getCompanyUser(companyId, userId);
      
      if (!companyUser) {
        return reply.code(403).send({
          success: false,
          message: 'You do not have access to this company',
          error: 'FORBIDDEN'
        });
      }
      
      if (companyUser.role !== 'OWNER' && companyUser.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'Only company owners and admins can perform this action',
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    } catch (error) {
      logger.error({ error, params: request.params, body: request.body }, 'Error checking admin/owner access');
      
      reply.code(500).send({
        success: false,
        message: 'Server error checking company access',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Helper to check if user has access to a company
   */
  private async checkUserCompanyAccess(userId: string, companyId: string): Promise<boolean> {
    try {
      const companies = await this.companyService.getUserCompanies(userId);
      return companies.some(company => company.id === companyId);
    } catch (error) {
      logger.error({ error, userId, companyId }, 'Error in checkUserCompanyAccess');
      return false;
    }
  }
}

// Create and export controller instance
export const companyUserController = new CompanyUserController(
  new CompanyUserService(null as any), // Placeholder - real datasource will be injected
  new CompanyService(null as any)      // Placeholder - real datasource will be injected
); 