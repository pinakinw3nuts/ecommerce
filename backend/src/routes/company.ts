import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CompanyService } from '../services/company.service';
import { requireUser, requireAdmin } from '../middleware/auth';
import { CompanyRole } from '../entities/CompanyRole';

const companyService = new CompanyService();

// Request schemas
const CreateCompanySchema = z.object({
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
  }).optional(),
  creditLimit: z.number().min(0).optional(),
  settings: z.object({
    allowPurchaseOrders: z.boolean().optional(),
    requirePOApproval: z.boolean().optional(),
    invoiceTermDays: z.number().int().min(0).optional(),
    taxExempt: z.boolean().optional(),
    allowedPaymentMethods: z.array(z.string()).optional()
  }).optional()
});

const UpdateCompanyProfileSchema = z.object({
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
    title: z.string(),
    email: z.string().email(),
    phone: z.string(),
    isPrimary: z.boolean().default(false)
  })).optional()
});

const UpdateCompanyCreditSchema = z.object({
  creditLimit: z.number().min(0),
  reasonForChange: z.string().min(3).max(200)
});

const AddCompanyUserSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(CompanyRole),
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

const UpdateCompanyUserSchema = z.object({
  role: z.nativeEnum(CompanyRole).optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  permissions: z.object({
    canManageUsers: z.boolean(),
    canViewReports: z.boolean(),
    canApproveOrders: z.boolean(),
    orderApprovalLimit: z.number().optional(),
    canManageProducts: z.boolean()
  }).optional(),
  isActive: z.boolean().optional()
});

// Helper function to check if user has access to a company
async function checkCompanyAccess(request: FastifyRequest, reply: FastifyReply) {
  const { companyId } = request.params as { companyId: string };
  const userId = (request.user as any).id;
  
  try {
    const companies = await companyService.getUserCompanies(userId);
    const hasAccess = companies.some(company => company.id === companyId);
    
    if (!hasAccess) {
      return reply.status(403).send({
        success: false,
        error: 'You do not have access to this company'
      });
    }
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: 'Failed to check company access'
    });
  }
}

export async function companyRoutes(fastify: FastifyInstance) {
  // Authenticated routes
  fastify.register(async (fastify: FastifyInstance) => {
    fastify.addHook('preHandler', requireUser);

    // Create a new company
    fastify.post('/', {
      schema: {
        body: CreateCompanySchema
      }
    }, async (request: FastifyRequest<{
      Body: z.infer<typeof CreateCompanySchema>;
    }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;
        // Ensure required properties are provided
        if (!request.body.name || !request.body.country) {
          return reply.status(400).send({
            success: false,
            message: 'Company name and country are required',
            error: 'MISSING_REQUIRED_FIELDS',
          });
        }
        
        const company = await companyService.createCompany({
          name: request.body.name,
          country: request.body.country,
          email: request.body.email,
          phoneNumber: request.body.phoneNumber,
          website: request.body.website,
          shippingAddress: request.body.shippingAddress ? {
            street: request.body.shippingAddress.street || '',
            city: request.body.shippingAddress.city || '',
            state: request.body.shippingAddress.state || '',
            country: request.body.shippingAddress.country || '',
            postalCode: request.body.shippingAddress.postalCode || '',
          } : undefined,
          billingAddress: request.body.billingAddress ? {
            street: request.body.billingAddress.street || '',
            city: request.body.billingAddress.city || '',
            state: request.body.billingAddress.state || '',
            country: request.body.billingAddress.country || '',
            postalCode: request.body.billingAddress.postalCode || '',
          } : undefined,
          settings: {
            allowPurchaseOrders: request.body.settings?.allowPurchaseOrders || false,
            requirePOApproval: request.body.settings?.requirePOApproval || true,
            invoiceTermDays: request.body.settings?.invoiceTermDays || 30,
            taxExempt: request.body.settings?.taxExempt || false,
            allowedPaymentMethods: request.body.settings?.allowedPaymentMethods || ['credit_card', 'bank_transfer'],
          },
        }, userId);
        
        return reply.status(201).send({
          success: true,
          message: 'Company created successfully',
          data: {
            id: company.id,
            name: company.name
          }
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create company'
        });
      }
    });

    // Get user's companies
    fastify.get('/user/companies', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;
        const companies = await companyService.getUserCompanies(userId);
        
        return reply.send({
          success: true,
          data: companies
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch user companies'
        });
      }
    });

    // Get company by ID (with access check)
    fastify.get('/:companyId', async (request: FastifyRequest<{
      Params: { companyId: string };
    }>, reply: FastifyReply) => {
      try {
        const { companyId } = request.params;
        const userId = (request.user as any).id;
        
        // Check if user has access to this company
        const companies = await companyService.getUserCompanies(userId);
        const hasAccess = companies.some(company => company.id === companyId);
        
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'You do not have access to this company'
          });
        }
        
        const company = await companyService.getCompanyById(companyId);
        
        if (!company) {
          return reply.status(404).send({
            success: false,
            error: 'Company not found'
          });
        }
        
        return reply.send({
          success: true,
          data: company
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch company'
        });
      }
    });

    // Update company profile
    fastify.put('/:companyId/profile', {
      schema: {
        body: UpdateCompanyProfileSchema
      },
      preHandler: [checkCompanyAccess]
    }, async (request: FastifyRequest<{
      Params: { companyId: string };
      Body: z.infer<typeof UpdateCompanyProfileSchema>;
    }>, reply: FastifyReply) => {
      try {
        const { companyId } = request.params;
        // Ensure required properties are provided for additional contacts
        const additionalContacts = request.body.additionalContacts?.map((contact: any) => ({
          name: contact.name || '',
          title: contact.title || '',
          email: contact.email || '',
          phone: contact.phone || '',
          isPrimary: contact.isPrimary || false,
        })) || [];
        
        const profile = await companyService.updateCompanyProfile(companyId, {
          ...request.body,
          additionalContacts,
        });
        
        return reply.send({
          success: true,
          message: 'Company profile updated successfully',
          data: profile
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update company profile'
        });
      }
    });

    // Get company credit info
    fastify.get('/:companyId/credit', {
      preHandler: [checkCompanyAccess]
    }, async (request: FastifyRequest<{
      Params: { companyId: string };
    }>, reply: FastifyReply) => {
      try {
        const { companyId } = request.params;
        const company = await companyService.getCompanyById(companyId);
        
        if (!company) {
          return reply.status(404).send({
            success: false,
            error: 'Company not found'
          });
        }
        
        const creditInfo = {
          creditLimit: company.creditLimit,
          availableCredit: company.availableCredit,
          usedCredit: company.creditLimit - company.availableCredit,
          creditUtilization: company.creditLimit > 0 ? ((company.creditLimit - company.availableCredit) / company.creditLimit) * 100 : 0
        };
        
        return reply.send({
          success: true,
          data: creditInfo
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch company credit info'
        });
      }
    });

    // Get company users (team members)
    fastify.get('/:companyId/users', {
      preHandler: [checkCompanyAccess]
    }, async (request: FastifyRequest<{
      Params: { companyId: string };
    }>, reply: FastifyReply) => {
      try {
        const { companyId } = request.params;
        const users = await companyService.getCompanyUsers(companyId);
        
        return reply.send({
          success: true,
          data: users
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch company users'
        });
      }
    });

    // Add company user
    fastify.post('/:companyId/users', {
      schema: {
        body: AddCompanyUserSchema
      },
      preHandler: [checkCompanyAccess]
    }, async (request: FastifyRequest<{
      Params: { companyId: string };
      Body: z.infer<typeof AddCompanyUserSchema>;
    }>, reply: FastifyReply) => {
      try {
        const { companyId } = request.params;
        
        // Ensure required properties are provided
        if (!request.body.userId || !request.body.role) {
          return reply.status(400).send({
            success: false,
            message: 'User ID and role are required',
            error: 'MISSING_REQUIRED_FIELDS',
          });
        }
        
        const companyUser = await companyService.addCompanyUser(companyId, {
          userId: request.body.userId,
          role: request.body.role,
          title: request.body.title,
          department: request.body.department,
          permissions: request.body.permissions,
        });
        
        return reply.status(201).send({
          success: true,
          message: 'User added to company successfully',
          data: companyUser
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add user to company'
        });
      }
    });

    // Update company user
    fastify.put('/:companyId/users/:userId', {
      schema: {
        body: UpdateCompanyUserSchema
      },
      preHandler: [checkCompanyAccess]
    }, async (request: FastifyRequest<{
      Params: { companyId: string; userId: string };
      Body: z.infer<typeof UpdateCompanyUserSchema>;
    }>, reply: FastifyReply) => {
      try {
        const { companyId, userId } = request.params;
        
        // Ensure required properties are provided for permissions
        const permissions = request.body.permissions ? {
          canManageUsers: request.body.permissions.canManageUsers || false,
          canViewReports: request.body.permissions.canViewReports || false,
          canApproveOrders: request.body.permissions.canApproveOrders || false,
          orderApprovalLimit: request.body.permissions.orderApprovalLimit,
          canManageProducts: request.body.permissions.canManageProducts || false,
        } : undefined;
        
        const companyUser = await companyService.updateCompanyUser(companyId, userId, {
          ...request.body,
          permissions,
        });
        
        return reply.send({
          success: true,
          message: 'Company user updated successfully',
          data: companyUser
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update company user'
        });
      }
    });

    // Remove company user
    fastify.delete('/:companyId/users/:userId', {
      preHandler: [checkCompanyAccess]
    }, async (request: FastifyRequest<{
      Params: { companyId: string; userId: string };
    }>, reply: FastifyReply) => {
      try {
        const { companyId, userId } = request.params;
        const success = await companyService.removeCompanyUser(companyId, userId);
        
        if (success) {
          return reply.send({
            success: true,
            message: 'User removed from company successfully'
          });
        } else {
          return reply.status(400).send({
            success: false,
            error: 'Failed to remove user from company'
          });
        }
      } catch (error) {
        return reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to remove user from company'
        });
      }
    });
  });

  // Admin routes
  fastify.register(async (fastify: FastifyInstance) => {
    fastify.addHook('preHandler', requireAdmin);

    // Get all companies (admin only)
    fastify.get('/admin/companies', async (request: FastifyRequest<{
      Querystring: {
        page?: number;
        limit?: number;
        name?: string;
        country?: string;
        isActive?: boolean;
      };
    }>, reply: FastifyReply) => {
      try {
        const { page = 1, limit = 20, name, country, isActive } = request.query;
        
        const result = await companyService.getAllCompanies(page, limit, {
          name,
          country,
          isActive
        });
        
        return reply.send({
          success: true,
          data: result.companies,
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch companies'
        });
      }
    });

    // Update company credit (admin only)
    fastify.put('/admin/:companyId/credit', {
      schema: {
        body: UpdateCompanyCreditSchema
      }
    }, async (request: FastifyRequest<{
      Params: { companyId: string };
      Body: z.infer<typeof UpdateCompanyCreditSchema>;
    }>, reply: FastifyReply) => {
      try {
        const { companyId } = request.params;
        const { creditLimit, reasonForChange } = request.body;
        
        const updatedCompany = await companyService.assignCreditLimit(companyId, creditLimit);
        
        return reply.send({
          success: true,
          message: 'Company credit updated successfully',
          data: {
            creditLimit: updatedCompany.creditLimit,
            availableCredit: updatedCompany.availableCredit,
            reasonForChange
          }
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update company credit'
        });
      }
    });

    // Get company by GST number (admin only)
    fastify.get('/admin/companies/gst/:gstNumber', async (request: FastifyRequest<{
      Params: { gstNumber: string };
    }>, reply: FastifyReply) => {
      try {
        const { gstNumber } = request.params;
        const company = await companyService.getCompanyByGst(gstNumber);
        
        if (!company) {
          return reply.status(404).send({
            success: false,
            error: 'Company not found'
          });
        }
        
        return reply.send({
          success: true,
          data: company
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch company by GST'
        });
      }
    });
  });
} 