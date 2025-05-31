import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';

// Company creation schema
const createCompanySchema = z.object({
  name: z.string().min(2).max(100),
  taxId: z.string().min(5).max(30),
  email: z.string().email(),
  phone: z.string().min(10).max(20).optional(),
  address: z.object({
    street: z.string().min(2).max(100),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    zipCode: z.string().min(5).max(10),
    country: z.string().min(2).max(50)
  }),
  industry: z.string().min(2).max(50).optional()
});

// Company update schema
const updateCompanySchema = createCompanySchema.partial();

/**
 * Company routes for managing B2B companies
 */
export async function companyRoutes(fastify: FastifyInstance): Promise<void> {
  // Get all companies (admin only)
  fastify.get('/', {
    schema: {
      tags: ['companies'],
      summary: 'Get all companies',
      description: 'Retrieves a list of all companies (admin only)',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'array', items: {} }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    onRequest: [authGuard, roleGuard(['admin'])]
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implement controller
    return reply.send({ 
      success: true,
      message: 'Companies retrieved successfully',
      data: []
    });
  });

  // Get a single company by ID
  fastify.get('/:id', {
    schema: {
      tags: ['companies'],
      summary: 'Get company by ID',
      description: 'Retrieves a single company by its ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { 
              type: 'object',
              properties: {
                id: { type: 'string' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    onRequest: [authGuard]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    // TODO: Implement controller
    return reply.send({ 
      success: true,
      message: 'Company retrieved successfully',
      data: { id }
    });
  });

  // Create a new company
  fastify.post('/', {
    schema: {
      tags: ['companies'],
      summary: 'Create a new company',
      description: 'Creates a new company (admin only)',
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          taxId: { type: 'string', minLength: 5, maxLength: 30 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', minLength: 10, maxLength: 20 },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string', minLength: 2, maxLength: 100 },
              city: { type: 'string', minLength: 2, maxLength: 50 },
              state: { type: 'string', minLength: 2, maxLength: 50 },
              zipCode: { type: 'string', minLength: 5, maxLength: 10 },
              country: { type: 'string', minLength: 2, maxLength: 50 }
            },
            required: ['street', 'city', 'state', 'zipCode', 'country']
          },
          industry: { type: 'string', minLength: 2, maxLength: 50 }
        },
        required: ['name', 'taxId', 'email', 'address']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { 
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preValidation: validateRequest(createCompanySchema),
    onRequest: [authGuard, roleGuard(['admin'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const companyData = request.body as z.infer<typeof createCompanySchema>;
    
    // TODO: Implement controller
    return reply.code(201).send({ 
      success: true,
      message: 'Company created successfully',
      data: { id: 'new-company-id', name: companyData.name, email: companyData.email }
    });
  });

  // Update a company
  fastify.put('/:id', {
    schema: {
      tags: ['companies'],
      summary: 'Update a company',
      description: 'Updates an existing company by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          taxId: { type: 'string', minLength: 5, maxLength: 30 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', minLength: 10, maxLength: 20 },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string', minLength: 2, maxLength: 100 },
              city: { type: 'string', minLength: 2, maxLength: 50 },
              state: { type: 'string', minLength: 2, maxLength: 50 },
              zipCode: { type: 'string', minLength: 5, maxLength: 10 },
              country: { type: 'string', minLength: 2, maxLength: 50 }
            }
          },
          industry: { type: 'string', minLength: 2, maxLength: 50 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { 
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preValidation: validateRequest(updateCompanySchema),
    onRequest: [authGuard]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const companyData = request.body as z.infer<typeof updateCompanySchema>;
    
    // TODO: Implement controller
    return reply.send({ 
      success: true,
      message: 'Company updated successfully',
      data: { id, name: companyData.name }
    });
  });

  // Delete a company
  fastify.delete('/:id', {
    schema: {
      tags: ['companies'],
      summary: 'Delete a company',
      description: 'Deletes a company by ID (admin only)',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { 
              type: 'object',
              properties: {
                companyId: { type: 'string' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    onRequest: [authGuard, roleGuard(['admin'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id: companyId } = request.params as { id: string };
    
    // TODO: Implement controller
    return reply.send({ 
      success: true,
      message: 'Company deleted successfully',
      data: { companyId }
    });
  });
} 