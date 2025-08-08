import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CompanyService } from '../services/company.service';
import { requireUser, requireAdmin } from '../middleware/auth';
import { CompanyRole } from '../entities/CompanyRole';

const companyService = new CompanyService();

// TS interfaces for bodies
type UpdateCompanyProfileBody = {
  businessType?: string;
  yearEstablished?: number;
  industry?: string;
  numberOfEmployees?: number;
  description?: string;
  logoUrl?: string;
  socialProfiles?: Partial<Record<'linkedin'|'twitter'|'facebook'|'instagram', string>>;
  taxInformation?: Partial<Record<'taxId'|'vatNumber'|'taxExemptionCertificate'|'taxClassification', string>>;
  bankInformation?: Partial<Record<'accountName'|'accountNumber'|'bankName'|'routingNumber'|'swiftCode'|'iban', string>>;
  additionalContacts?: Array<{ name: string; title: string; email: string; phone: string; isPrimary?: boolean; }>;
  [key: string]: any;
};

type AddCompanyUserBody = {
  userId: string;
  role: CompanyRole | 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';
  title?: string;
  department?: string;
  permissions?: {
    canManageUsers?: boolean;
    canViewReports?: boolean;
    canApproveOrders?: boolean;
    orderApprovalLimit?: number;
    canManageProducts?: boolean;
  };
};

type UpdateCompanyUserBody = Partial<AddCompanyUserBody>;

type UpdateCompanyCreditBody = { creditLimit: number; reasonForChange: string };

// Request schemas
const CreateCompanySchema = {
  type: 'object',
  required: ['name', 'country'],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    gstNumber: { type: 'string' },
    country: { type: 'string', minLength: 2, maxLength: 50 },
    phoneNumber: { type: 'string' },
    email: { type: 'string', format: 'email' },
    website: { type: 'string', format: 'uri' },
    billingAddress: {
      type: 'object',
      required: ['street', 'city', 'state', 'postalCode', 'country'],
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        postalCode: { type: 'string' },
        country: { type: 'string' }
      }
    },
    shippingAddress: {
      type: 'object',
      required: ['street', 'city', 'state', 'postalCode', 'country'],
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        postalCode: { type: 'string' },
        country: { type: 'string' }
      }
    },
    creditLimit: { type: 'number', minimum: 0 },
    settings: {
      type: 'object',
      properties: {
        allowPurchaseOrders: { type: 'boolean' },
        requirePOApproval: { type: 'boolean' },
        invoiceTermDays: { type: 'integer', minimum: 0 },
        taxExempt: { type: 'boolean' },
        allowedPaymentMethods: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};

const UpdateCompanyProfileSchema = {
  type: 'object',
  properties: {
    businessType: { type: 'string' },
    yearEstablished: { type: 'integer', minimum: 1800, maximum: 2024 },
    industry: { type: 'string' },
    numberOfEmployees: { type: 'integer', minimum: 1 },
    description: { type: 'string' },
    logoUrl: { type: 'string', format: 'uri' },
    socialProfiles: {
      type: 'object',
      properties: {
        linkedin: { type: 'string', format: 'uri' },
        twitter: { type: 'string', format: 'uri' },
        facebook: { type: 'string', format: 'uri' },
        instagram: { type: 'string', format: 'uri' }
      }
    },
    taxInformation: {
      type: 'object',
      properties: {
        taxId: { type: 'string' },
        vatNumber: { type: 'string' },
        taxExemptionCertificate: { type: 'string' },
        taxClassification: { type: 'string' }
      }
    },
    bankInformation: {
      type: 'object',
      properties: {
        accountName: { type: 'string' },
        accountNumber: { type: 'string' },
        bankName: { type: 'string' },
        routingNumber: { type: 'string' },
        swiftCode: { type: 'string' },
        iban: { type: 'string' }
      }
    },
    additionalContacts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'title', 'email', 'phone'],
        properties: {
          name: { type: 'string' },
          title: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          isPrimary: { type: 'boolean', default: false }
        }
      }
    }
  }
};

const UpdateCompanyCreditSchema = {
  type: 'object',
  required: ['creditLimit', 'reasonForChange'],
  properties: {
    creditLimit: { type: 'number', minimum: 0 },
    reasonForChange: { type: 'string', minLength: 3, maxLength: 200 }
  }
};

const AddCompanyUserSchema = {
  type: 'object',
  required: ['userId', 'role'],
  properties: {
    userId: { type: 'string', format: 'uuid' },
    role: { type: 'string', enum: ['OWNER', 'ADMIN', 'MANAGER', 'USER', 'VIEWER'] },
    title: { type: 'string' },
    department: { type: 'string' },
    permissions: {
      type: 'object',
      properties: {
        canManageUsers: { type: 'boolean' },
        canViewReports: { type: 'boolean' },
        canApproveOrders: { type: 'boolean' },
        orderApprovalLimit: { type: 'number' },
        canManageProducts: { type: 'boolean' }
      }
    }
  }
};

const UpdateCompanyUserSchema = {
  type: 'object',
  properties: {
    role: { type: 'string', enum: ['OWNER', 'ADMIN', 'MANAGER', 'USER', 'VIEWER'] },
    title: { type: 'string' },
    department: { type: 'string' },
    permissions: {
      type: 'object',
      properties: {
        canManageUsers: { type: 'boolean' },
        canViewReports: { type: 'boolean' },
        canApproveOrders: { type: 'boolean' },
        orderApprovalLimit: { type: 'number' },
        canManageProducts: { type: 'boolean' }
      }
    }
  }
};

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
      Body: {
        name: string;
        gstNumber?: string;
        country: string;
        phoneNumber?: string;
        email?: string;
        website?: string;
        billingAddress?: {
          street: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
        shippingAddress?: {
          street: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
        creditLimit?: number;
        settings?: {
          allowPurchaseOrders?: boolean;
          requirePOApproval?: boolean;
          invoiceTermDays?: number;
          taxExempt?: boolean;
          allowedPaymentMethods?: string[];
        };
      };
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
    }, async (request: FastifyRequest<{ Params: { companyId: string }; Body: UpdateCompanyProfileBody }>, reply: FastifyReply) => {
      try {
        const { companyId } = request.params;
        // Ensure required properties are provided for additional contacts
        const additionalContacts = (request.body.additionalContacts || []).map((contact) => ({
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
    }, async (request: FastifyRequest<{ Params: { companyId: string }; Body: AddCompanyUserBody }>, reply: FastifyReply) => {
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
          role: request.body.role as any,
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
    }, async (request: FastifyRequest<{ Params: { companyId: string; userId: string }; Body: UpdateCompanyUserBody }>, reply: FastifyReply) => {
      try {
        const { companyId, userId } = request.params;
        
        // Ensure required properties are provided for permissions
        const permissions = request.body.permissions ? {
          canManageUsers: !!request.body.permissions.canManageUsers,
          canViewReports: !!request.body.permissions.canViewReports,
          canApproveOrders: !!request.body.permissions.canApproveOrders,
          orderApprovalLimit: request.body.permissions.orderApprovalLimit,
          canManageProducts: !!request.body.permissions.canManageProducts,
        } : undefined;
        
        const companyUser = await companyService.updateCompanyUser(companyId, userId, {
          ...request.body,
          role: request.body.role as any,
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
    }, async (request: FastifyRequest<{ Params: { companyId: string }; Body: UpdateCompanyCreditBody }>, reply: FastifyReply) => {
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