import { DataSource, Repository } from 'typeorm';
import { CompanyUser } from '../entities/CompanyUser';
import { Company } from '../entities/Company';
import { CompanyRole } from '../constants/roles';
import logger from '../utils/logger';
import crypto from 'crypto';

export class CompanyUserService {
  private companyUserRepository: Repository<CompanyUser>;

  constructor(private dataSource: DataSource) {
    this.companyUserRepository = dataSource.getRepository(CompanyUser);
  }

  /**
   * Add a new team member to a company
   */
  async addTeamMember(
    companyId: string,
    addedByUserId: string,
    userData: {
      userId: string;
      role: CompanyRole;
      title?: string;
      department?: string;
      email?: string;
    }
  ): Promise<CompanyUser> {
    return this.dataSource.transaction(async transactionManager => {
      try {
        // Verify company exists
        const company = await transactionManager.findOneBy(Company, { id: companyId });
        if (!company) {
          throw new Error(`Company with ID ${companyId} not found`);
        }

        // Verify the user adding the member has appropriate permissions
        const addingUser = await transactionManager.findOneBy(CompanyUser, {
          companyId,
          userId: addedByUserId
        });

        if (!addingUser) {
          throw new Error(`User with ID ${addedByUserId} is not a member of this company`);
        }

        // Check if the user has admin or owner role to add members
        if (addingUser.role !== 'OWNER' && addingUser.role !== 'ADMIN') {
          throw new Error('Only company owners and admins can add team members');
        }

        // Check if user is already in the company
        const existingUser = await transactionManager.findOneBy(CompanyUser, {
          companyId,
          userId: userData.userId
        });

        if (existingUser) {
          throw new Error(`User already belongs to this company`);
        }

        // Generate invitation token and expiry
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationExpiry = new Date();
        invitationExpiry.setDate(invitationExpiry.getDate() + 7); // 7 days expiry

        // Set role-based permissions
        const permissions = {
          canManageUsers: userData.role === 'OWNER' || userData.role === 'ADMIN',
          canViewReports: true,
          canApproveOrders: userData.role === 'OWNER' || userData.role === 'ADMIN' || userData.role === 'APPROVER',
          orderApprovalLimit: userData.role === 'APPROVER' ? 5000 : userData.role === 'ADMIN' ? 10000 : userData.role === 'OWNER' ? undefined : 0,
          canManageProducts: userData.role === 'OWNER' || userData.role === 'ADMIN' || userData.role === 'BUYER'
        };

        // Create new company user with properly typed permissions
        const companyUser = new CompanyUser();
        companyUser.companyId = companyId;
        companyUser.userId = userData.userId;
        companyUser.role = userData.role;
        companyUser.title = userData.title || '';
        companyUser.department = userData.department || '';
        companyUser.permissions = permissions;
        companyUser.invitationToken = invitationToken;
        companyUser.invitationExpiry = invitationExpiry;
        companyUser.hasAcceptedInvitation = false;

        const savedUser = await transactionManager.save(companyUser);
        
        logger.info({
          companyId,
          addedByUserId,
          newUserId: userData.userId,
          role: userData.role
        }, 'Team member added to company');

        return savedUser;
      } catch (error) {
        logger.error({
          error,
          companyId,
          addedByUserId,
          userData
        }, 'Failed to add team member');
        throw error;
      }
    });
  }

  /**
   * Update a team member's role and permissions
   */
  async updateTeamMemberRole(
    companyId: string,
    updatedByUserId: string,
    targetUserId: string,
    newRole: CompanyRole,
    customPermissions?: any
  ): Promise<CompanyUser> {
    return this.dataSource.transaction(async transactionManager => {
      try {
        // Verify company exists
        const company = await transactionManager.findOneBy(Company, { id: companyId });
        if (!company) {
          throw new Error(`Company with ID ${companyId} not found`);
        }

        // Verify the user updating has appropriate permissions
        const updatingUser = await transactionManager.findOneBy(CompanyUser, {
          companyId,
          userId: updatedByUserId
        });

        if (!updatingUser) {
          throw new Error(`User with ID ${updatedByUserId} is not a member of this company`);
        }

        // Only owners and admins can update roles
        if (updatingUser.role !== CompanyRole.OWNER && updatingUser.role !== CompanyRole.ADMIN) {
          throw new Error('Only company owners and admins can update team member roles');
        }

        // Find the target user
        const targetUser = await transactionManager.findOneBy(CompanyUser, {
          companyId,
          userId: targetUserId
        });

        if (!targetUser) {
          throw new Error(`Target user not found in company`);
        }

        // Enforce owner-only restrictions
        if (targetUser.role === CompanyRole.OWNER && newRole !== CompanyRole.OWNER) {
          // Only an owner can demote another owner
          if (updatingUser.role !== CompanyRole.OWNER) {
            throw new Error('Only an owner can change another owner\'s role');
          }
        }

        if (newRole === CompanyRole.OWNER && updatingUser.role !== CompanyRole.OWNER) {
          throw new Error('Only an existing owner can assign the owner role');
        }

        // Prevent the last owner from being demoted
        if (targetUser.role === CompanyRole.OWNER && newRole !== CompanyRole.OWNER) {
          // Count owners
          const ownersCount = await transactionManager.count(CompanyUser, {
            where: { companyId, role: CompanyRole.OWNER }
          });

          if (ownersCount <= 1) {
            throw new Error('Cannot change role of the last company owner');
          }
        }

        // Set role-based permissions
        const permissions = customPermissions || {
          canManageUsers: newRole === CompanyRole.OWNER || newRole === CompanyRole.ADMIN,
          canViewReports: true,
          canApproveOrders: newRole === CompanyRole.OWNER || newRole === CompanyRole.ADMIN || newRole === CompanyRole.APPROVER,
          orderApprovalLimit: newRole === CompanyRole.APPROVER ? 5000 : newRole === CompanyRole.ADMIN ? 10000 : newRole === CompanyRole.OWNER ? undefined : 0,
          canManageProducts: newRole === CompanyRole.OWNER || newRole === CompanyRole.ADMIN || newRole === CompanyRole.BUYER
        };

        // Update the target user
        targetUser.role = newRole;
        targetUser.permissions = permissions;

        const updatedUser = await transactionManager.save(targetUser);
        
        logger.info({
          companyId,
          updatedByUserId,
          targetUserId,
          oldRole: targetUser.role,
          newRole
        }, 'Team member role updated');

        return updatedUser;
      } catch (error) {
        logger.error({
          error,
          companyId,
          updatedByUserId,
          targetUserId,
          newRole
        }, 'Failed to update team member role');
        throw error;
      }
    });
  }

  /**
   * Remove a team member from company
   */
  async removeTeamMember(
    companyId: string,
    removedByUserId: string,
    targetUserId: string
  ): Promise<boolean> {
    return this.dataSource.transaction(async transactionManager => {
      try {
        // Verify company exists
        const company = await transactionManager.findOneBy(Company, { id: companyId });
        if (!company) {
          throw new Error(`Company with ID ${companyId} not found`);
        }

        // Verify the user removing has appropriate permissions
        const removingUser = await transactionManager.findOneBy(CompanyUser, {
          companyId,
          userId: removedByUserId
        });

        if (!removingUser) {
          throw new Error(`User with ID ${removedByUserId} is not a member of this company`);
        }

        // Only owners and admins can remove members
        if (removingUser.role !== CompanyRole.OWNER && removingUser.role !== CompanyRole.ADMIN) {
          throw new Error('Only company owners and admins can remove team members');
        }

        // Find the target user
        const targetUser = await transactionManager.findOneBy(CompanyUser, {
          companyId,
          userId: targetUserId
        });

        if (!targetUser) {
          throw new Error(`Target user not found in company`);
        }

        // Enforce owner-only restrictions
        if (targetUser.role === CompanyRole.OWNER) {
          // Only an owner can remove another owner
          if (removingUser.role !== CompanyRole.OWNER) {
            throw new Error('Only an owner can remove another owner');
          }

          // Count owners
          const ownersCount = await transactionManager.count(CompanyUser, {
            where: { companyId, role: CompanyRole.OWNER }
          });

          if (ownersCount <= 1) {
            throw new Error('Cannot remove the last company owner');
          }
        }

        // Prevent self-removal for the last owner
        if (removingUser.role === CompanyRole.OWNER && targetUserId === removedByUserId) {
          const ownersCount = await transactionManager.count(CompanyUser, {
            where: { companyId, role: CompanyRole.OWNER }
          });

          if (ownersCount <= 1) {
            throw new Error('Cannot remove yourself as the last company owner');
          }
        }

        // Remove the user
        const result = await transactionManager.delete(CompanyUser, {
          companyId,
          userId: targetUserId
        });

        logger.info({
          companyId,
          removedByUserId,
          targetUserId,
          targetRole: targetUser.role
        }, 'Team member removed from company');

        return result.affected ? result.affected > 0 : false;
      } catch (error) {
        logger.error({
          error,
          companyId,
          removedByUserId,
          targetUserId
        }, 'Failed to remove team member');
        throw error;
      }
    });
  }

  /**
   * Accept a team member invitation
   */
  async acceptInvitation(
    invitationToken: string,
    userId: string
  ): Promise<CompanyUser> {
    try {
      const invitation = await this.companyUserRepository.findOneBy({
        invitationToken,
        hasAcceptedInvitation: false
      });

      if (!invitation) {
        throw new Error('Invalid or expired invitation token');
      }

      // Check if invitation has expired
      if (invitation.invitationExpiry && invitation.invitationExpiry < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Verify this invitation belongs to the correct user
      if (invitation.userId !== userId) {
        throw new Error('Invitation does not belong to this user');
      }

      // Accept invitation
      invitation.hasAcceptedInvitation = true;
      invitation.invitationToken = '';
      invitation.invitationExpiry = new Date(); // Set to current date instead of null

      const acceptedInvitation = await this.companyUserRepository.save(invitation);

      logger.info({
        companyId: invitation.companyId,
        userId
      }, 'Team member accepted invitation');

      return acceptedInvitation;
    } catch (error) {
      logger.error({
        error,
        invitationToken,
        userId
      }, 'Failed to accept invitation');
      throw error;
    }
  }

  /**
   * Resend team member invitation
   */
  async resendInvitation(
    companyId: string,
    requestedByUserId: string,
    targetUserId: string
  ): Promise<CompanyUser> {
    try {
      // Verify the user requesting has appropriate permissions
      const requestingUser = await this.companyUserRepository.findOneBy({
        companyId,
        userId: requestedByUserId
      });

      if (!requestingUser) {
        throw new Error(`User with ID ${requestedByUserId} is not a member of this company`);
      }

      // Only owners and admins can resend invitations
      if (requestingUser.role !== 'OWNER' && requestingUser.role !== 'ADMIN') {
        throw new Error('Only company owners and admins can resend invitations');
      }

      // Find the target user
      const targetUser = await this.companyUserRepository.findOneBy({
        companyId,
        userId: targetUserId
      });

      if (!targetUser) {
        throw new Error(`Target user not found in company`);
      }

      // Check if invitation is already accepted
      if (targetUser.hasAcceptedInvitation) {
        throw new Error('User has already accepted the invitation');
      }

      // Generate new token and expiry
      targetUser.invitationToken = Math.random().toString(36).substring(2, 15);
      
      const invitationExpiry = new Date();
      invitationExpiry.setDate(invitationExpiry.getDate() + 7);
      targetUser.invitationExpiry = invitationExpiry;

      const updatedUser = await this.companyUserRepository.save(targetUser);

      logger.info({
        companyId,
        requestedByUserId,
        targetUserId
      }, 'Team member invitation resent');

      return updatedUser;
    } catch (error) {
      logger.error({
        error,
        companyId,
        requestedByUserId,
        targetUserId
      }, 'Failed to resend invitation');
      throw error;
    }
  }

  /**
   * Get all team members for a company
   */
  async getTeamMembers(
    companyId: string,
    filters?: { role?: CompanyRole; isActive?: boolean }
  ): Promise<CompanyUser[]> {
    try {
      const queryBuilder = this.companyUserRepository
        .createQueryBuilder('companyUser')
        .where('companyUser.companyId = :companyId', { companyId });

      // Apply filters
      if (filters?.role) {
        queryBuilder.andWhere('companyUser.role = :role', { role: filters.role });
      }

      if (filters?.isActive !== undefined) {
        queryBuilder.andWhere('companyUser.isActive = :isActive', { isActive: filters.isActive });
      }

      const users = await queryBuilder
        .orderBy('companyUser.role', 'ASC')
        .addOrderBy('companyUser.createdAt', 'DESC')
        .getMany();

      return users;
    } catch (error) {
      logger.error({
        error,
        companyId,
        filters
      }, 'Failed to get team members');
      throw error;
    }
  }

  /**
   * Get all companies a user belongs to
   */
  async getUserCompanies(
    userId: string,
    includeInvitations: boolean = false
  ): Promise<{ company: Company; role: CompanyRole; hasAcceptedInvitation: boolean }[]> {
    try {
      const queryBuilder = this.companyUserRepository
        .createQueryBuilder('companyUser')
        .leftJoinAndSelect('companyUser.company', 'company')
        .where('companyUser.userId = :userId', { userId })
        .andWhere('companyUser.isActive = :isActive', { isActive: true });

      // Only include accepted invitations if specified
      if (!includeInvitations) {
        queryBuilder.andWhere('companyUser.hasAcceptedInvitation = :hasAccepted', { hasAccepted: true });
      }

      const companyUsers = await queryBuilder
        .orderBy('company.name', 'ASC')
        .getMany();

      return companyUsers.map(cu => ({
        company: cu.company,
        role: cu.role,
        hasAcceptedInvitation: cu.hasAcceptedInvitation
      }));
    } catch (error) {
      logger.error({
        error,
        userId,
        includeInvitations
      }, 'Failed to get user companies');
      throw error;
    }
  }

  /**
   * Get a specific company user record
   */
  async getCompanyUser(
    companyId: string,
    userId: string
  ): Promise<CompanyUser | null> {
    try {
      const companyUser = await this.companyUserRepository.findOneBy({
        companyId,
        userId
      });

      return companyUser;
    } catch (error) {
      logger.error({
        error,
        companyId,
        userId
      }, 'Failed to get company user');
      throw error;
    }
  }
} 