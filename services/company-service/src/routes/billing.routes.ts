import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { validateRequest, ValidateTarget } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import { billingController } from '../controllers/billing.controller';

// Schema for company ID in params
const companyIdParamsSchema = z.object({
  companyId: z.string().uuid()
});

// Schema for invoice ID in params
const invoiceIdParamsSchema = z.object({
  invoiceId: z.string().uuid()
});

// Schema for creating a payment method
const paymentMethodSchema = z.object({
  companyId: z.string().uuid(),
  type: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'DIRECT_DEBIT', 'CHECK']),
  isDefault: z.boolean().default(false),
  details: z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    bankName: z.string().optional(),
    cardType: z.string().optional(),
    lastFourDigits: z.string().optional(),
    expiryMonth: z.string().optional(),
    expiryYear: z.string().optional()
  }),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }).optional()
});

// Schema for payment gateway callback
const paymentCallbackSchema = z.object({
  paymentId: z.string(),
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING']),
  amount: z.number(),
  currency: z.string(),
  referenceId: z.string().optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.string()).optional()
});

// Billing settings schema
const billingSettingsSchema = z.object({
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'check', 'credit_account']),
  billingAddress: z.object({
    street: z.string().min(2).max(100),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    zipCode: z.string().min(5).max(10),
    country: z.string().min(2).max(50)
  }),
  billingEmail: z.string().email(),
  billingCycle: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  autoPayEnabled: z.boolean().optional().default(false),
  taxExempt: z.boolean().optional().default(false),
  taxId: z.string().optional()
});

// Invoice query schema
const invoiceQuerySchema = z.object({
  status: z.enum(['paid', 'unpaid', 'overdue', 'all']).optional().default('all'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  page: z.number().int().min(1).optional().default(1)
});

/**
 * Routes for managing company billing
 */
export async function billingRoutes(fastify: FastifyInstance): Promise<void> {
  // Get billing settings for a company
  fastify.get('/settings/:companyId', {
    schema: {
      tags: ['billing'],
      summary: 'Get billing settings',
      description: 'Retrieves billing settings for a specific company',
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
                paymentMethod: { type: 'string' },
                billingAddress: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zipCode: { type: 'string' },
                    country: { type: 'string' }
                  }
                },
                billingEmail: { type: 'string' },
                billingCycle: { type: 'string' },
                autoPayEnabled: { type: 'boolean' },
                taxExempt: { type: 'boolean' }
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
      message: 'Billing settings retrieved successfully',
      data: {
        companyId,
        paymentMethod: 'credit_account',
        billingAddress: {
          street: '123 Business St',
          city: 'Enterprise',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        billingEmail: 'billing@example.com',
        billingCycle: 'monthly',
        autoPayEnabled: true,
        taxExempt: false
      }
    });
  });

  // Update billing settings
  fastify.put('/settings/:companyId', {
    schema: {
      tags: ['billing'],
      summary: 'Update billing settings',
      description: 'Updates billing settings for a specific company',
      params: {
        type: 'object',
        properties: {
          companyId: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          paymentMethod: { type: 'string', enum: ['credit_card', 'bank_transfer', 'check', 'credit_account'] },
          billingAddress: {
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
          billingEmail: { type: 'string', format: 'email' },
          billingCycle: { type: 'string', enum: ['weekly', 'biweekly', 'monthly'] },
          autoPayEnabled: { type: 'boolean' },
          taxExempt: { type: 'boolean' },
          taxId: { type: 'string' }
        },
        required: ['paymentMethod', 'billingAddress', 'billingEmail']
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
                paymentMethod: { type: 'string' },
                billingAddress: { type: 'object' },
                billingEmail: { type: 'string' },
                billingCycle: { type: 'string' },
                autoPayEnabled: { type: 'boolean' },
                taxExempt: { type: 'boolean' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preValidation: validateRequest(billingSettingsSchema),
    onRequest: [authGuard, roleGuard(['admin', 'company_admin', 'accountant'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = request.params as { companyId: string };
    const settingsData = request.body as z.infer<typeof billingSettingsSchema>;
    
    // TODO: Implement controller
    return reply.send({
      success: true,
      message: 'Billing settings updated successfully',
      data: {
        companyId,
        ...settingsData,
        updatedAt: new Date().toISOString()
      }
    });
  });

  // Get company invoices
  fastify.get('/invoices/:companyId', {
    schema: {
      tags: ['billing'],
      summary: 'Get company invoices',
      description: 'Retrieves invoices for a specific company with filtering options',
      params: {
        type: 'object',
        properties: {
          companyId: { type: 'string', format: 'uuid' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['paid', 'unpaid', 'overdue', 'all'], default: 'all' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          page: { type: 'integer', minimum: 1, default: 1 }
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
                invoices: { type: 'array', items: {} },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    pages: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preValidation: validateRequest(invoiceQuerySchema, ValidateTarget.QUERY),
    onRequest: [authGuard]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = request.params as { companyId: string };
    const query = request.query as z.infer<typeof invoiceQuerySchema>;
    
    // TODO: Implement controller
    return reply.send({
      success: true,
      message: 'Invoices retrieved successfully',
      data: {
        companyId,
        invoices: [],
        pagination: {
          total: 0,
          page: query.page,
          limit: query.limit,
          pages: 0
        }
      }
    });
  });

  // Get a specific invoice (public API version)
  fastify.get('/invoice/:invoiceId', {
    schema: {
      tags: ['billing'],
      summary: 'Get invoice details',
      description: 'Retrieves details of a specific invoice',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', format: 'uuid' }
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
                companyId: { type: 'string' },
                amount: { type: 'number' },
                status: { type: 'string' },
                dueDate: { type: 'string', format: 'date' },
                items: { type: 'array', items: {} }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    onRequest: [authGuard]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { invoiceId } = request.params as { invoiceId: string };
    
    // TODO: Implement controller
    return reply.send({
      success: true,
      message: 'Invoice retrieved successfully',
      data: {
        id: invoiceId,
        companyId: 'dummy-company-id',
        amount: 1250.00,
        status: 'unpaid',
        dueDate: '2023-05-15',
        items: []
      }
    });
  });

  // Mark invoice as paid (admin only)
  fastify.put('/invoice/:invoiceId/paid', {
    schema: {
      tags: ['billing'],
      summary: 'Mark invoice as paid',
      description: 'Marks a specific invoice as paid (admin only)',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', format: 'uuid' }
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
                status: { type: 'string' },
                paidAt: { type: 'string', format: 'date-time' },
                paidBy: { type: 'string' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    onRequest: [authGuard, roleGuard(['admin'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { invoiceId } = request.params as { invoiceId: string };
    const user = request.user as any;
    
    // TODO: Implement controller
    return reply.send({
      success: true,
      message: 'Invoice marked as paid',
      data: {
        id: invoiceId,
        status: 'paid',
        paidAt: new Date().toISOString(),
        paidBy: user.id
      }
    });
  });

  // Generate payment receipt
  fastify.post('/receipt/:invoiceId', {
    schema: {
      tags: ['billing'],
      summary: 'Generate payment receipt',
      description: 'Generates a payment receipt for a specific invoice',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', format: 'uuid' }
        }
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
                receiptId: { type: 'string' },
                invoiceId: { type: 'string' },
                amount: { type: 'number' },
                paymentDate: { type: 'string', format: 'date-time' },
                paymentMethod: { type: 'string' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    onRequest: [authGuard]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { invoiceId } = request.params as { invoiceId: string };
    
    // TODO: Implement controller
    return reply.code(201).send({
      success: true,
      message: 'Receipt generated successfully',
      data: {
        receiptId: 'rcpt-' + Date.now(),
        invoiceId,
        amount: 1250.00,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'credit_account'
      }
    });
  });

  // Check if we're in a protected context (has auth decorator)
  const isProtected = fastify.hasDecorator('auth');
  
  if (isProtected) {
    // Get all invoices for a company
    fastify.get(
      '/:companyId/invoices',
      {
        schema: {
          tags: ['billing'],
          summary: 'Get company invoices (admin)',
          description: 'Admin endpoint to retrieve invoices for a specific company',
          params: {
            type: 'object',
            properties: {
              companyId: { type: 'string', format: 'uuid' }
            }
          },
          security: [{ bearerAuth: [] }]
        },
        preHandler: [
          authGuard,
          validateRequest(companyIdParamsSchema, ValidateTarget.PARAMS),
          async (request, reply) => {
            await billingController.checkCompanyAccess(request, reply);
          }
        ]
      },
      billingController.getCompanyInvoices.bind(billingController)
    );

    // Get a specific invoice (admin API version)
    fastify.get(
      '/admin-invoices/:invoiceId',
      {
        schema: {
          tags: ['billing'],
          summary: 'Get invoice details (admin)',
          description: 'Admin endpoint to retrieve details of a specific invoice',
          params: {
            type: 'object',
            properties: {
              invoiceId: { type: 'string', format: 'uuid' }
            }
          },
          security: [{ bearerAuth: [] }]
        },
        preHandler: [
          authGuard,
          validateRequest(invoiceIdParamsSchema, ValidateTarget.PARAMS)
        ]
      },
      billingController.getInvoiceDetails.bind(billingController)
    );

    // Add a payment method to a company
    fastify.post(
      '/payment-methods',
      {
        schema: {
          tags: ['billing'],
          summary: 'Add payment method',
          description: 'Adds a new payment method to a company',
          body: {
            type: 'object',
            properties: {
              companyId: { type: 'string', format: 'uuid' },
              type: { type: 'string', enum: ['CREDIT_CARD', 'BANK_TRANSFER', 'DIRECT_DEBIT', 'CHECK'] },
              isDefault: { type: 'boolean' },
              details: {
                type: 'object',
                properties: {
                  accountName: { type: 'string' },
                  accountNumber: { type: 'string' },
                  routingNumber: { type: 'string' },
                  bankName: { type: 'string' },
                  cardType: { type: 'string' },
                  lastFourDigits: { type: 'string' },
                  expiryMonth: { type: 'string' },
                  expiryYear: { type: 'string' }
                }
              },
              billingAddress: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  postalCode: { type: 'string' },
                  country: { type: 'string' }
                }
              }
            },
            required: ['companyId', 'type', 'details']
          },
          security: [{ bearerAuth: [] }]
        },
        preHandler: [
          authGuard,
          validateRequest(paymentMethodSchema, ValidateTarget.BODY),
          async (request, reply) => {
            await billingController.checkFinanceAccess(request, reply);
          }
        ]
      },
      billingController.addPaymentMethod.bind(billingController)
    );

    // Get payment methods for a company
    fastify.get(
      '/:companyId/payment-methods',
      {
        schema: {
          tags: ['billing'],
          summary: 'Get payment methods',
          description: 'Retrieves all payment methods for a specific company',
          params: {
            type: 'object',
            properties: {
              companyId: { type: 'string', format: 'uuid' }
            }
          },
          security: [{ bearerAuth: [] }]
        },
        preHandler: [
          authGuard,
          validateRequest(companyIdParamsSchema, ValidateTarget.PARAMS),
          async (request, reply) => {
            await billingController.checkCompanyAccess(request, reply);
          }
        ]
      },
      billingController.getPaymentMethods.bind(billingController)
    );

    // Pay an invoice
    fastify.post(
      '/invoices/:invoiceId/pay',
      {
        schema: {
          tags: ['billing'],
          summary: 'Pay invoice',
          description: 'Processes payment for a specific invoice',
          params: {
            type: 'object',
            properties: {
              invoiceId: { type: 'string', format: 'uuid' }
            }
          },
          security: [{ bearerAuth: [] }]
        },
        preHandler: [
          authGuard,
          validateRequest(invoiceIdParamsSchema, ValidateTarget.PARAMS),
          async (request, reply) => {
            await billingController.checkFinanceAccess(request, reply);
          }
        ]
      },
      billingController.payInvoice.bind(billingController)
    );
  }

  // Public route for payment gateway callbacks
  fastify.post(
    '/payment-callback',
    {
      schema: {
        tags: ['billing'],
        summary: 'Payment gateway callback',
        description: 'Handles callbacks from payment gateways after processing payments',
        body: {
          type: 'object',
          properties: {
            paymentId: { type: 'string' },
            status: { type: 'string', enum: ['SUCCESS', 'FAILED', 'PENDING'] },
            amount: { type: 'number' },
            currency: { type: 'string' },
            referenceId: { type: 'string' },
            errorMessage: { type: 'string' },
            metadata: { type: 'object', additionalProperties: { type: 'string' } }
          },
          required: ['paymentId', 'status', 'amount', 'currency']
        }
      },
      preHandler: [
        validateRequest(paymentCallbackSchema, ValidateTarget.BODY)
      ]
    },
    billingController.handlePaymentCallback.bind(billingController)
  );
} 