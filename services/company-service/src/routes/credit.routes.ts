import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';

// Credit update schema
const updateCreditSchema = z.object({
  creditLimit: z.number().positive(),
  currentBalance: z.number().optional(),
  availableCredit: z.number().optional(),
  paymentTerms: z.object({
    days: z.number().int().positive(),
    type: z.enum(['net', 'end_of_month']).default('net')
  }).optional(),
  status: z.enum(['active', 'suspended', 'pending_review']).optional()
});

// Credit request schema
const creditRequestSchema = z.object({
  companyId: z.string().uuid(),
  requestedAmount: z.number().positive(),
  reason: z.string().min(10).max(500),
  documents: z.array(z.string().url()).optional()
});

/**
 * Routes for managing company credit
 */
export async function creditRoutes(fastify: FastifyInstance): Promise<void> {
  // Get company credit information
  fastify.get('/company/:companyId', {
    schema: {
      tags: ['credit'],
      summary: 'Get company credit information',
      description: 'Retrieves credit information for a specific company',
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
                creditLimit: { type: 'number' },
                currentBalance: { type: 'number' },
                availableCredit: { type: 'number' },
                paymentTerms: {
                  type: 'object',
                  properties: {
                    days: { type: 'integer' },
                    type: { type: 'string', enum: ['net', 'end_of_month'] }
                  }
                },
                status: { type: 'string', enum: ['active', 'suspended', 'pending_review'] },
                lastUpdated: { type: 'string', format: 'date-time' }
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
      message: 'Credit information retrieved successfully',
      data: {
        companyId,
        creditLimit: 50000,
        currentBalance: 12500,
        availableCredit: 37500,
        paymentTerms: {
          days: 30,
          type: 'net'
        },
        status: 'active',
        lastUpdated: new Date().toISOString()
      }
    });
  });

  // Update company credit (admin only)
  fastify.put('/company/:companyId', {
    schema: {
      tags: ['credit'],
      summary: 'Update company credit',
      description: 'Updates credit information for a specific company (admin only)',
      params: {
        type: 'object',
        properties: {
          companyId: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          creditLimit: { type: 'number' },
          currentBalance: { type: 'number' },
          availableCredit: { type: 'number' },
          paymentTerms: {
            type: 'object',
            properties: {
              days: { type: 'integer' },
              type: { type: 'string', enum: ['net', 'end_of_month'] }
            }
          },
          status: { type: 'string', enum: ['active', 'suspended', 'pending_review'] }
        },
        required: ['creditLimit']
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
                creditLimit: { type: 'number' },
                currentBalance: { type: 'number' },
                availableCredit: { type: 'number' },
                paymentTerms: {
                  type: 'object',
                  properties: {
                    days: { type: 'integer' },
                    type: { type: 'string' }
                  }
                },
                status: { type: 'string' },
                lastUpdated: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preValidation: validateRequest(updateCreditSchema),
    onRequest: [authGuard, roleGuard(['admin'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = request.params as { companyId: string };
    const creditData = request.body as z.infer<typeof updateCreditSchema>;
    
    // TODO: Implement controller
    return reply.send({
      success: true,
      message: 'Credit information updated successfully',
      data: {
        companyId,
        ...creditData,
        lastUpdated: new Date().toISOString()
      }
    });
  });

  // Request credit increase
  fastify.post('/request', {
    schema: {
      tags: ['credit'],
      summary: 'Request credit increase',
      description: 'Submits a request for credit limit increase',
      body: {
        type: 'object',
        properties: {
          companyId: { type: 'string', format: 'uuid' },
          requestedAmount: { type: 'number' },
          reason: { type: 'string', minLength: 10, maxLength: 500 },
          documents: { type: 'array', items: { type: 'string', format: 'uri' } }
        },
        required: ['companyId', 'requestedAmount', 'reason']
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
                requestId: { type: 'string' },
                companyId: { type: 'string' },
                requestedAmount: { type: 'number' },
                reason: { type: 'string' },
                documents: { type: 'array', items: { type: 'string' } },
                status: { type: 'string' },
                submittedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preValidation: validateRequest(creditRequestSchema),
    onRequest: [authGuard, roleGuard(['company_admin', 'admin'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestData = request.body as z.infer<typeof creditRequestSchema>;
    
    // TODO: Implement controller
    return reply.code(201).send({
      success: true,
      message: 'Credit increase request submitted successfully',
      data: {
        requestId: 'cr-' + Date.now(),
        ...requestData,
        status: 'pending',
        submittedAt: new Date().toISOString()
      }
    });
  });

  // Get credit history for a company
  fastify.get('/history/:companyId', {
    schema: {
      tags: ['credit'],
      summary: 'Get credit history',
      description: 'Retrieves credit history for a specific company',
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
                history: { type: 'array', items: {} }
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
      message: 'Credit history retrieved successfully',
      data: {
        companyId,
        history: []
      }
    });
  });

  // Get all pending credit requests (admin only)
  fastify.get('/requests/pending', {
    schema: {
      tags: ['credit'],
      summary: 'Get pending credit requests',
      description: 'Retrieves all pending credit increase requests (admin only)',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                requests: { type: 'array', items: {} }
              }
            }
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
      message: 'Pending credit requests retrieved successfully',
      data: {
        requests: []
      }
    });
  });

  // Approve or reject a credit request (admin only)
  fastify.put('/request/:requestId', {
    schema: {
      tags: ['credit'],
      summary: 'Process credit request',
      description: 'Approves or rejects a credit increase request (admin only)',
      params: {
        type: 'object',
        properties: {
          requestId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['approved', 'rejected'] },
          notes: { type: 'string' },
          approvedAmount: { type: 'number' }
        },
        required: ['status']
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
                requestId: { type: 'string' },
                status: { type: 'string' },
                notes: { type: 'string' },
                approvedAmount: { type: 'number' },
                processedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preValidation: validateRequest(
      z.object({
        status: z.enum(['approved', 'rejected']),
        notes: z.string().optional(),
        approvedAmount: z.number().positive().optional()
      })
    ),
    onRequest: [authGuard, roleGuard(['admin'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { requestId } = request.params as { requestId: string };
    const updateData = request.body as { 
      status: 'approved' | 'rejected';
      notes?: string;
      approvedAmount?: number;
    };
    
    // TODO: Implement controller
    return reply.send({
      success: true,
      message: `Credit request ${updateData.status}`,
      data: {
        requestId,
        ...updateData,
        processedAt: new Date().toISOString()
      }
    });
  });
} 