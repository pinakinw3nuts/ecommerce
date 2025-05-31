import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CompanyService } from '../services/company.service';
import { CreditService } from '../services/credit.service';
import { validateRequest, ValidateTarget } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';
import logger from '../utils/logger';
import { RequestUser } from '../middlewares/authGuard';

// Schema for creating a company
const createCompanySchema = z.object({
  name: z.string().min(2).max(100),
  gstNumber: z.string().optional(),
  country: z.string().min(2).max(50),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }).optional(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }).optional()
});

// Schema for updating company credit
const updateCompanyCreditSchema = z.object({
  creditLimit: z.number().min(0),
  availableCredit: z.number().min(0).optional(),
  paymentTerms: z.number().int().min(0).optional(), // days
  creditStatus: z.enum(['ACTIVE', 'SUSPENDED', 'REVIEW']).optional(),
  reasonForChange: z.string().min(3).max(200)
});

// Schema for updating a company profile
const updateCompanyProfileSchema = z.object({
  businessType: z.string().optional(),
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  industry: z.string().optional(),
  numberOfEmployees: z.number().int().min(1).optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  socialProfiles: z.object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional()
  }).optional(),
  taxInformation: z.object({
    taxId: z.string().optional(),
    vatNumber: z.string().optional(),
    taxExemptionCertificate: z.string().optional(),
    taxClassification: z.string().optional()
  }).optional(),
  bankInformation: z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    routingNumber: z.string().optional(),
    swiftCode: z.string().optional(),
    iban: z.string().optional()
  }).optional(),
  additionalContacts: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    isPrimary: z.boolean().default(false)
  })).optional()
});

// Request params schema with company ID
const companyIdParamsSchema = z.object({
  companyId: z.string().uuid()
});

// Query params for GET companies
const getCompaniesQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).default('20'),
  name: z.string().optional(),
  country: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional()
});

// Define a type for the profile data to handle the additionalContacts issue
type ProfileData = z.infer<typeof updateCompanyProfileSchema>;

export class CompanyController {
  constructor(
    private companyService: CompanyService,
    private creditService: CreditService
  ) {}

  /**
   * Register public routes (no auth required)
   */
  async registerPublicRoutes(_fastify: FastifyInstance): Promise<void> {
    // No public endpoints for company controller
  }

  /**
   * Register protected routes (auth required)
   */
  async registerProtectedRoutes(fastify: FastifyInstance): Promise<void> {
    // Create a new company
    fastify.post(
      '/',
      { 
        preHandler: [
          authGuard,
          validateRequest(createCompanySchema, ValidateTarget.BODY)
        ]
      },
      this.createCompany.bind(this)
    );

    // Get all companies (admin only)
    fastify.get(
      '/',
      { 
        preHandler: [
          authGuard,
          validateRequest(getCompaniesQuerySchema, ValidateTarget.QUERY)
        ]
      },
      this.getCompanies.bind(this)
    );

    // Get a specific company
    fastify.get(
      '/:companyId',
      { 
        preHandler: [
          authGuard,
          validateRequest(companyIdParamsSchema, ValidateTarget.PARAMS)
        ]
      },
      this.getCompanyById.bind(this)
    );

    // Update company profile
    fastify.put(
      '/:companyId/profile',
      { 
        preHandler: [
          authGuard,
          validateRequest(companyIdParamsSchema, ValidateTarget.PARAMS),
          validateRequest(updateCompanyProfileSchema, ValidateTarget.BODY),
          this.checkCompanyAccess.bind(this)
        ]
      },
      this.updateCompanyProfile.bind(this)
    );

    // Get company credit info
    fastify.get(
      '/:companyId/credit',
      { 
        preHandler: [
          authGuard,
          validateRequest(companyIdParamsSchema, ValidateTarget.PARAMS),
          this.checkCompanyAccess.bind(this)
        ]
      },
      this.getCompanyCredit.bind(this)
    );

    // Update company credit (admin only)
    fastify.put(
      '/:companyId/credit',
      { 
        preHandler: [
          authGuard,
          validateRequest(companyIdParamsSchema, ValidateTarget.PARAMS),
          validateRequest(updateCompanyCreditSchema, ValidateTarget.BODY),
          this.checkAdminAccess.bind(this)
        ]
      },
      this.updateCompanyCredit.bind(this)
    );

    // Get user's companies
    fastify.get(
      '/user/companies',
      { 
        preHandler: [
          authGuard
        ]
      },
      this.getUserCompanies.bind(this)
    );
  }

  /**
   * Create a new company
   */
  async createCompany(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const companyData = request.body as z.infer<typeof createCompanySchema>;
      const user = request.user as RequestUser;
      const userId = user.id;
      
      const company = await this.companyService.createCompany(companyData, userId);
      
      reply.code(201).send({
        success: true,
        message: 'Company created successfully',
        data: {
          id: company.id,
          name: company.name
        }
      });
    } catch (error) {
      logger.error({ error, body: request.body }, 'Error creating company');
      
      reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create company',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Get all companies (admin only)
   */
  async getCompanies(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const user = request.user as RequestUser;
      // Check if user is admin (this would typically check against a global admin role)
      if (user.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'Admin access required',
          error: 'FORBIDDEN'
        });
      }

      const query = request.query as z.infer<typeof getCompaniesQuerySchema>;
      
      const { companies, total } = await this.companyService.getAllCompanies(
        query.page,
        query.limit,
        {
          name: query.name,
          country: query.country,
          isActive: query.isActive
        }
      );
      
      reply.code(200).send({
        success: true,
        data: companies,
        pagination: {
          total,
          page: query.page,
          limit: query.limit,
          pages: Math.ceil(total / query.limit)
        }
      });
    } catch (error) {
      logger.error({ error, query: request.query }, 'Error fetching companies');
      
      reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch companies',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Get company by ID
   */
  async getCompanyById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { companyId } = request.params as z.infer<typeof companyIdParamsSchema>;
      const user = request.user as RequestUser;
      const userId = user.id;
      
      // Check if user has access to this company unless they're an admin
      if (user.role !== 'ADMIN') {
        const hasAccess = await this.checkUserCompanyAccess(userId, companyId);
        if (!hasAccess) {
          return reply.code(403).send({
            success: false,
            message: 'You do not have access to this company',
            error: 'FORBIDDEN'
          });
        }
      }
      
      const company = await this.companyService.getCompanyById(companyId);
      
      if (!company) {
        return reply.code(404).send({
          success: false,
          message: 'Company not found',
          error: 'NOT_FOUND'
        });
      }
      
      reply.code(200).send({
        success: true,
        data: company
      });
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error fetching company');
      
      reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch company',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Update company profile
   */
  async updateCompanyProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { companyId } = request.params as z.infer<typeof companyIdParamsSchema>;
      const profileData = request.body as ProfileData;
      
      // Transform additionalContacts to match the required format if it exists
      if (profileData.additionalContacts) {
        profileData.additionalContacts = profileData.additionalContacts.map(contact => ({
          name: contact.name,
          title: contact.title || '',
          email: contact.email,
          phone: contact.phone || '',
          isPrimary: contact.isPrimary
        }));
      }
      
      // Use type assertion to overcome the type mismatch
      const profile = await this.companyService.updateCompanyProfile(companyId, profileData as any);
      
      reply.code(200).send({
        success: true,
        message: 'Company profile updated successfully',
        data: profile
      });
    } catch (error) {
      logger.error({ error, params: request.params, body: request.body }, 'Error updating company profile');
      
      reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update company profile',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Get company credit information
   */
  async getCompanyCredit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { companyId } = request.params as z.infer<typeof companyIdParamsSchema>;
      
      const creditInfo = await this.creditService.getCreditInfo(companyId);
      
      reply.code(200).send({
        success: true,
        data: creditInfo
      });
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error fetching company credit info');
      
      reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch company credit info',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Update company credit (admin only)
   */
  async updateCompanyCredit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { companyId } = request.params as z.infer<typeof companyIdParamsSchema>;
      const creditData = request.body as z.infer<typeof updateCompanyCreditSchema>;
      const user = request.user as RequestUser;
      const adminId = user.id;
      
      // Log credit change event with admin details
      logger.info({
        adminId,
        adminEmail: user.email,
        companyId,
        creditChange: creditData,
        timestamp: new Date().toISOString()
      }, 'Company credit update requested');
      
      // Use setCreditLimit instead of updateCreditInfo which doesn't exist
      const updatedCredit = await this.creditService.setCreditLimit(
        companyId,
        creditData.creditLimit,
        adminId,
        creditData.reasonForChange
      );
      
      // Log successful credit change
      logger.info({
        adminId,
        adminEmail: user.email,
        companyId,
        updatedCredit,
        reason: creditData.reasonForChange,
        timestamp: new Date().toISOString()
      }, 'Company credit updated successfully');
      
      reply.code(200).send({
        success: true,
        message: 'Company credit updated successfully',
        data: updatedCredit
      });
    } catch (error) {
      const user = request.user as RequestUser;
      logger.error({ 
        error, 
        params: request.params, 
        body: request.body,
        adminId: user.id,
        adminEmail: user.email
      }, 'Error updating company credit');
      
      reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update company credit',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Get all companies a user belongs to
   */
  async getUserCompanies(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const user = request.user as RequestUser;
      const userId = user.id;
      
      const companies = await this.companyService.getUserCompanies(userId);
      
      reply.code(200).send({
        success: true,
        data: companies
      });
    } catch (error) {
      const user = request.user as RequestUser;
      logger.error({ error, userId: user.id }, 'Error fetching user companies');
      
      reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user companies',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Middleware to check if user has access to a specific company
   */
  async checkCompanyAccess(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { companyId } = request.params as z.infer<typeof companyIdParamsSchema>;
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
      logger.error({ error, params: request.params }, 'Error checking company access');
      
      reply.code(500).send({
        success: false,
        message: 'Server error checking company access',
        error: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Middleware to check if user has admin access
   */
  async checkAdminAccess(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const user = request.user as RequestUser;
      // Check if user is a system admin
      if (user.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          message: 'Admin access required',
          error: 'FORBIDDEN'
        });
      }
    } catch (error) {
      const user = request.user as RequestUser;
      logger.error({ error, userId: user.id }, 'Error checking admin access');
      
      reply.code(500).send({
        success: false,
        message: 'Server error checking admin access',
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
export const companyController = new CompanyController(
  new CompanyService(null as any), // Placeholder - real datasource will be injected
  new CreditService(null as any)   // Placeholder - real datasource will be injected
); 