import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';

// Schema for adding a user to a company
const addUserSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'accountant', 'member']),
  permissions: z.array(z.string()).optional()
});

// Schema for updating a user's role or permissions
const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'accountant', 'member']).optional(),
  permissions: z.array(z.string()).optional()
}).refine(data => data.role !== undefined || data.permissions !== undefined, {
  message: 'Either role or permissions must be provided'
});

/**
 * Routes for managing company users
 */
export async function companyUserRoutes(fastify: FastifyInstance): Promise<void> {
  // Get all users for a company
  fastify.get('/company/:companyId', {
    schema: {
      tags: ['users'],
      summary: 'Get all users for a company',
      description: 'Retrieves all users associated with a specific company',
      params: {
        type: 'object',
        properties: {
          companyId: { type: 'string', format: 'uuid' }
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
                companyId: { type: 'string' },
                users: { type: 'array', items: {} }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    onRequest: [authGuard]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = request.params as { companyId: string };
    
    // TODO: Implement controller
    return reply.send({
      success: true,
      message: 'Company users retrieved successfully',
      data: {
        companyId,
        users: []
      }
    });
  });

  // Add a user to a company
  fastify.post('/', {
    schema: {
      tags: ['users'],
      summary: 'Add a user to a company',
      description: 'Adds a user to a company with a specific role and permissions',
      body: {
        type: 'object',
        properties: {
          companyId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['admin', 'manager', 'accountant', 'member'] },
          permissions: { type: 'array', items: { type: 'string' } }
        },
        required: ['companyId', 'userId', 'role']
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
                companyId: { type: 'string' },
                userId: { type: 'string' },
                role: { type: 'string' },
                permissions: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preValidation: validateRequest(addUserSchema),
    onRequest: [authGuard, roleGuard(['admin', 'company_admin'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userData = request.body as z.infer<typeof addUserSchema>;
    
    // TODO: Implement controller
    return reply.code(201).send({
      success: true,
      message: 'User added to company successfully',
      data: userData
    });
  });

  // Update a user's role in a company
  fastify.put('/:id', {
    schema: {
      tags: ['users'],
      summary: 'Update user role or permissions',
      description: 'Updates a user\'s role or permissions within a company',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['admin', 'manager', 'accountant', 'member'] },
          permissions: { type: 'array', items: { type: 'string' } }
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
                userId: { type: 'string' },
                role: { type: 'string' },
                permissions: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preValidation: validateRequest(updateUserRoleSchema),
    onRequest: [authGuard, roleGuard(['admin', 'company_admin'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id: userId } = request.params as { id: string };
    const updateData = request.body as z.infer<typeof updateUserRoleSchema>;
    
    // TODO: Implement controller
    return reply.send({
      success: true,
      message: 'User role updated successfully',
      data: { userId, ...updateData }
    });
  });

  // Remove a user from a company
  fastify.delete('/:id', {
    schema: {
      tags: ['users'],
      summary: 'Remove user from company',
      description: 'Removes a user from a company',
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
                userId: { type: 'string' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    onRequest: [authGuard, roleGuard(['admin', 'company_admin'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id: userId } = request.params as { id: string };
    
    // TODO: Implement controller
    return reply.send({
      success: true,
      message: 'User removed from company successfully',
      data: { userId }
    });
  });

  // Get companies for the current user
  fastify.get('/my-companies', {
    schema: {
      tags: ['users'],
      summary: 'Get current user\'s companies',
      description: 'Retrieves all companies associated with the current user',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                companies: { type: 'array', items: {} }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    onRequest: [authGuard]
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implement controller - get current user's companies
    return reply.send({
      success: true,
      message: 'User companies retrieved successfully',
      data: {
        companies: []
      }
    });
  });
} 