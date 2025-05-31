import { DataSource, Repository } from 'typeorm';
import { Company } from '../entities/Company';
import { CompanyUser } from '../entities/CompanyUser';
import { CompanyProfile } from '../entities/CompanyProfile';
import logger from '../utils/logger';
import { CompanyRole } from '../constants/roles';

export class CompanyService {
  private companyRepository: Repository<Company>;
  private companyUserRepository: Repository<CompanyUser>;
  private companyProfileRepository: Repository<CompanyProfile>;

  constructor(private dataSource: DataSource) {
    this.companyRepository = this.dataSource.getRepository(Company);
    this.companyUserRepository = this.dataSource.getRepository(CompanyUser);
    this.companyProfileRepository = this.dataSource.getRepository(CompanyProfile);
  }

  /**
   * Create a new company and assign the creator as the owner
   */
  async createCompany(
    companyData: Partial<Company>,
    userId: string
  ): Promise<Company> {
    // Start a transaction to ensure data consistency
    return this.dataSource.transaction(async transactionalEntityManager => {
      try {
        // Create the company
        const company = transactionalEntityManager.create(Company, {
          name: companyData.name,
          gstNumber: companyData.gstNumber,
          country: companyData.country,
          phoneNumber: companyData.phoneNumber,
          email: companyData.email,
          website: companyData.website,
          billingAddress: companyData.billingAddress,
          shippingAddress: companyData.shippingAddress,
          creditLimit: companyData.creditLimit || 0,
          availableCredit: companyData.creditLimit || 0,
          settings: companyData.settings || {
            allowPurchaseOrders: false,
            requirePOApproval: true,
            invoiceTermDays: 30,
            taxExempt: false,
            allowedPaymentMethods: ['credit_card', 'bank_transfer']
          }
        });

        // Save company
        const savedCompany = await transactionalEntityManager.save(company);
        logger.info({ companyId: savedCompany.id }, 'Company created successfully');

        // Create company profile
        const profile = transactionalEntityManager.create(CompanyProfile, {
          companyId: savedCompany.id
        });
        await transactionalEntityManager.save(profile);
        logger.info({ companyId: savedCompany.id }, 'Company profile created');

        // Create the company owner
        const companyUser = transactionalEntityManager.create(CompanyUser, {
          companyId: savedCompany.id,
          userId,
          role: CompanyRole.OWNER,
          permissions: {
            canManageUsers: true,
            canViewReports: true,
            canApproveOrders: true,
            orderApprovalLimit: undefined, // Unlimited
            canManageProducts: true
          },
          isActive: true,
          hasAcceptedInvitation: true
        });
        await transactionalEntityManager.save(companyUser);
        logger.info({ companyId: savedCompany.id, userId }, 'User assigned as company owner');

        return savedCompany;
      } catch (error) {
        logger.error({ error, companyData }, 'Error creating company');
        throw error;
      }
    });
  }

  /**
   * Update company information
   */
  async updateCompany(
    companyId: string,
    companyData: Partial<Company>
  ): Promise<Company> {
    try {
      // Find the company
      const company = await this.companyRepository.findOneBy({ id: companyId });
      if (!company) {
        throw new Error(`Company with ID ${companyId} not found`);
      }

      // Update company fields
      const updatedCompany = {
        ...company,
        ...companyData,
        // Protect fields that shouldn't be directly updated
        id: company.id,
        createdAt: company.createdAt
      };

      // Save and return updated company
      const result = await this.companyRepository.save(updatedCompany);
      logger.info({ companyId }, 'Company updated successfully');
      
      return result;
    } catch (error) {
      logger.error({ error, companyId, companyData }, 'Error updating company');
      throw error;
    }
  }

  /**
   * Update company profile information
   */
  async updateCompanyProfile(
    companyId: string,
    profileData: Partial<CompanyProfile>
  ): Promise<CompanyProfile> {
    try {
      // Find the company profile
      const profile = await this.companyProfileRepository.findOneBy({ companyId });
      
      if (!profile) {
        // Create profile if it doesn't exist
        const newProfile = this.companyProfileRepository.create({
          companyId,
          ...profileData,
        });
        const savedProfile = await this.companyProfileRepository.save(newProfile);
        logger.info({ companyId }, 'Company profile created');
        return savedProfile;
      }

      // Update profile fields
      const updatedProfile = {
        ...profile,
        ...profileData,
        // Protect fields that shouldn't be directly updated
        id: profile.id,
        companyId: profile.companyId,
        createdAt: profile.createdAt
      };

      // Save and return updated profile
      const result = await this.companyProfileRepository.save(updatedProfile);
      logger.info({ companyId }, 'Company profile updated successfully');
      
      return result;
    } catch (error) {
      logger.error({ error, companyId, profileData }, 'Error updating company profile');
      throw error;
    }
  }

  /**
   * Get company by ID with full profile and users
   */
  async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
        relations: ['profile', 'users']
      });
      
      return company;
    } catch (error) {
      logger.error({ error, companyId }, 'Error fetching company');
      throw error;
    }
  }

  /**
   * Get company by GST number
   */
  async getCompanyByGst(gstNumber: string): Promise<Company | null> {
    try {
      const company = await this.companyRepository.findOne({
        where: { gstNumber },
        relations: ['profile']
      });
      
      return company;
    } catch (error) {
      logger.error({ error, gstNumber }, 'Error fetching company by GST');
      throw error;
    }
  }

  /**
   * Assign credit limit to a company
   */
  async assignCreditLimit(
    companyId: string,
    creditLimit: number
  ): Promise<Company> {
    try {
      if (creditLimit < 0) {
        throw new Error('Credit limit cannot be negative');
      }

      const company = await this.companyRepository.findOneBy({ id: companyId });
      if (!company) {
        throw new Error(`Company with ID ${companyId} not found`);
      }

      // Calculate new available credit (current available + (new limit - old limit))
      const currentAvailable = company.availableCredit;
      const oldLimit = company.creditLimit;
      const creditDifference = creditLimit - oldLimit;
      const newAvailable = currentAvailable + creditDifference;

      // Update company with new credit limit and available credit
      company.creditLimit = creditLimit;
      company.availableCredit = newAvailable;

      const updatedCompany = await this.companyRepository.save(company);
      logger.info({ 
        companyId, 
        oldCreditLimit: oldLimit, 
        newCreditLimit: creditLimit,
        availableCredit: newAvailable
      }, 'Company credit limit updated');
      
      return updatedCompany;
    } catch (error) {
      logger.error({ error, companyId, creditLimit }, 'Error assigning credit limit');
      throw error;
    }
  }

  /**
   * Add company team member
   */
  async addCompanyUser(
    companyId: string,
    userData: {
      userId: string;
      role: CompanyRole;
      title?: string;
      department?: string;
      permissions?: any;
    }
  ): Promise<CompanyUser> {
    try {
      // Check if company exists
      const company = await this.companyRepository.findOneBy({ id: companyId });
      if (!company) {
        throw new Error(`Company with ID ${companyId} not found`);
      }

      // Check if user is already in the company
      const existingUser = await this.companyUserRepository.findOneBy({
        companyId,
        userId: userData.userId
      });

      if (existingUser) {
        throw new Error(`User already belongs to this company`);
      }

      // Create invitation token (would be used to send invite email)
      const invitationToken = Math.random().toString(36).substring(2, 15);
      
      // Set expiry for 7 days from now
      const invitationExpiry = new Date();
      invitationExpiry.setDate(invitationExpiry.getDate() + 7);

      // Create company user
      const companyUser = this.companyUserRepository.create({
        companyId,
        userId: userData.userId,
        role: userData.role,
        title: userData.title,
        department: userData.department,
        permissions: userData.permissions || {
          canManageUsers: userData.role === 'OWNER' || userData.role === 'ADMIN',
          canViewReports: true,
          canApproveOrders: userData.role === 'OWNER' || userData.role === 'ADMIN' || userData.role === 'APPROVER',
          canManageProducts: userData.role === 'OWNER' || userData.role === 'ADMIN' || userData.role === 'BUYER'
        },
        invitationToken,
        invitationExpiry,
        hasAcceptedInvitation: false
      });

      const savedUser = await this.companyUserRepository.save(companyUser);
      logger.info({ companyId, userId: userData.userId, role: userData.role }, 'User added to company');
      
      return savedUser;
    } catch (error) {
      logger.error({ error, companyId, userData }, 'Error adding company user');
      throw error;
    }
  }

  /**
   * Update company user role and permissions
   */
  async updateCompanyUser(
    companyId: string,
    userId: string,
    updates: Partial<CompanyUser>
  ): Promise<CompanyUser> {
    try {
      const companyUser = await this.companyUserRepository.findOneBy({
        companyId,
        userId
      });

      if (!companyUser) {
        throw new Error(`User not found in company`);
      }

      // Update fields
      Object.assign(companyUser, updates);

      const updatedUser = await this.companyUserRepository.save(companyUser);
      logger.info({ companyId, userId }, 'Company user updated');
      
      return updatedUser;
    } catch (error) {
      logger.error({ error, companyId, userId, updates }, 'Error updating company user');
      throw error;
    }
  }

  /**
   * Get all companies (with pagination)
   */
  async getAllCompanies(
    page: number = 1,
    limit: number = 20,
    filters: any = {}
  ): Promise<{ companies: Company[]; total: number }> {
    try {
      const queryBuilder = this.companyRepository.createQueryBuilder('company');
      
      // Apply filters
      if (filters.name) {
        queryBuilder.andWhere('company.name ILIKE :name', { name: `%${filters.name}%` });
      }
      
      if (filters.country) {
        queryBuilder.andWhere('company.country = :country', { country: filters.country });
      }
      
      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('company.isActive = :isActive', { isActive: filters.isActive });
      }

      // Count total before pagination
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('company.name', 'ASC');
      
      const companies = await queryBuilder.getMany();
      
      return { companies, total };
    } catch (error) {
      logger.error({ error, page, limit, filters }, 'Error fetching companies');
      throw error;
    }
  }

  /**
   * Get companies a user belongs to
   */
  async getUserCompanies(userId: string): Promise<Company[]> {
    try {
      const companyUsers = await this.companyUserRepository.find({
        where: { userId, isActive: true },
        relations: ['company']
      });
      
      return companyUsers.map(cu => cu.company);
    } catch (error) {
      logger.error({ error, userId }, 'Error fetching user companies');
      throw error;
    }
  }

  /**
   * Get company users (team members)
   */
  async getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    try {
      const users = await this.companyUserRepository.find({
        where: { companyId }
      });
      
      return users;
    } catch (error) {
      logger.error({ error, companyId }, 'Error fetching company users');
      throw error;
    }
  }

  /**
   * Remove user from company
   */
  async removeCompanyUser(companyId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is the company owner
      const user = await this.companyUserRepository.findOneBy({
        companyId,
        userId
      });

      if (!user) {
        throw new Error(`User not found in company`);
      }

      if (user.role === 'OWNER') {
        throw new Error('Cannot remove company owner');
      }

      // Delete the company user
      const result = await this.companyUserRepository.delete({
        companyId,
        userId
      });

      logger.info({ companyId, userId }, 'User removed from company');
      
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      logger.error({ error, companyId, userId }, 'Error removing company user');
      throw error;
    }
  }
} 