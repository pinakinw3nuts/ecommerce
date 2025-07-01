import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { PaymentMethod } from '../entities/payment-method.entity';

const adminLogger = logger.child({ module: 'AdminRoutes' });

// Admin payment list query schema
const adminPaymentListQuerySchema = z.object({
  page: z.preprocess(val => typeof val === 'string' ? parseInt(val) : val, z.number().int().optional().default(1)),
  pageSize: z.preprocess(val => typeof val === 'string' ? parseInt(val) : val, z.number().int().optional().default(10)),
  search: z.string().optional(),
  orderId: z.string().optional(),
  status: z.string().optional(),
  provider: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  minAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Admin payment method list query schema
const adminPaymentMethodListQuerySchema = z.object({
  page: z.preprocess(val => typeof val === 'string' ? parseInt(val) : val, z.number().int().optional().default(1)),
  pageSize: z.preprocess(val => typeof val === 'string' ? parseInt(val) : val, z.number().int().optional().default(10)),
  search: z.string().optional(),
  status: z.string().optional(),
  provider: z.string().optional(),
  type: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Interface for service parameters to avoid type errors
interface AdminPaymentListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  orderId?: string;
  status?: string;
  provider?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AdminPaymentMethodListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  provider?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function adminRoutes(fastify: FastifyInstance) {
  const paymentService = fastify.paymentService;
  
  // GET /admin/payments - List all payments with filters and pagination
  fastify.get('/admin/payments', {
    schema: {
      tags: ['admin-payments'],
      description: 'List all payments (admin only)',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          search: { type: 'string', description: 'Search by order ID or transaction ID' },
          orderId: { type: 'string', format: 'uuid', description: 'Filter by exact order ID' },
          status: { type: 'string', description: 'Filter by payment status' },
          provider: { type: 'string', description: 'Filter by payment provider' },
          fromDate: { type: 'string', format: 'date', description: 'Filter by date range (from)' },
          toDate: { type: 'string', format: 'date', description: 'Filter by date range (to)' },
          minAmount: { type: 'number', description: 'Filter by minimum amount' },
          maxAmount: { type: 'number', description: 'Filter by maximum amount' },
          sortBy: { type: 'string', description: 'Field to sort by' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' }
        }
      },
      response: {
        200: {
          description: 'List of payments with pagination',
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Payment ID' },
                  orderId: { type: 'string', description: 'Order ID' },
                  userId: { type: 'string', description: 'User ID' },
                  amount: { type: 'number', description: 'Payment amount' },
                  currency: { type: 'string', description: 'Currency code' },
                  status: { type: 'string', description: 'Payment status' },
                  provider: { type: 'string', description: 'Payment provider' },
                  createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
                  updatedAt: { type: 'string', format: 'date-time', description: 'Update timestamp' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer', description: 'Total number of payments' },
                currentPage: { type: 'integer', description: 'Current page' },
                pageSize: { type: 'integer', description: 'Items per page' },
                totalPages: { type: 'integer', description: 'Total pages' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const query = adminPaymentListQuerySchema.parse(request.query);
      
      adminLogger.info({ query }, 'Admin requesting payment list');
      
      // Create a properly typed params object
      const params: AdminPaymentListParams = {
        page: query.page,
        pageSize: query.pageSize
      };
      
      // Only add optional fields if they exist
      if (query.search) params.search = query.search;
      if (query.orderId) params.orderId = query.orderId;
      if (query.status) params.status = query.status;
      if (query.provider) params.provider = query.provider;
      if (query.fromDate) params.fromDate = query.fromDate;
      if (query.toDate) params.toDate = query.toDate;
      if (query.minAmount !== undefined) params.minAmount = query.minAmount;
      if (query.maxAmount !== undefined) params.maxAmount = query.maxAmount;
      if (query.sortBy) params.sortBy = query.sortBy;
      if (query.sortOrder) params.sortOrder = query.sortOrder;
      
      // Call service method to get all payments with filters
      const result = await paymentService.getAllPayments(params);
      
      return reply.send(result);
    } catch (error) {
      adminLogger.error({ err: error }, 'Error listing payments for admin');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch payments'
      });
    }
  });
  
  // GET /admin/payment-methods - List all payment methods with filters and pagination
  fastify.get('/admin/payment-methods', {
    schema: {
      tags: ['admin-payment-methods'],
      description: 'List all payment methods (admin only)',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          search: { type: 'string', description: 'Search by brand or last 4 digits' },
          status: { type: 'string', description: 'Filter by status' },
          provider: { type: 'string', description: 'Filter by provider' },
          type: { type: 'string', description: 'Filter by payment method type' },
          sortBy: { type: 'string', description: 'Field to sort by' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' }
        }
      },
      response: {
        200: {
          description: 'List of payment methods with pagination',
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Payment method ID' },
                  userId: { type: 'string', description: 'User ID' },
                  type: { type: 'string', description: 'Payment method type' },
                  provider: { type: 'string', description: 'Payment provider' },
                  brand: { type: 'string', description: 'Card brand' },
                  last4: { type: 'string', description: 'Last 4 digits' },
                  expiryMonth: { type: 'string', description: 'Expiry month' },
                  expiryYear: { type: 'string', description: 'Expiry year' },
                  status: { type: 'string', description: 'Status' },
                  isDefault: { type: 'boolean', description: 'Is default payment method' },
                  createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
                  updatedAt: { type: 'string', format: 'date-time', description: 'Update timestamp' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer', description: 'Total number of payment methods' },
                currentPage: { type: 'integer', description: 'Current page' },
                pageSize: { type: 'integer', description: 'Items per page' },
                totalPages: { type: 'integer', description: 'Total pages' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const query = adminPaymentMethodListQuerySchema.parse(request.query);
      
      adminLogger.info({ query }, 'Admin requesting payment method list');
      
      // Create a properly typed params object
      const params: AdminPaymentMethodListParams = {
        page: query.page,
        pageSize: query.pageSize
      };
      
      // Only add optional fields if they exist
      if (query.search) params.search = query.search;
      if (query.status) params.status = query.status;
      if (query.provider) params.provider = query.provider;
      if (query.type) params.type = query.type;
      if (query.sortBy) params.sortBy = query.sortBy;
      if (query.sortOrder) params.sortOrder = query.sortOrder;
      
      // Call service method to get all payment methods with filters
      const result = await paymentService.getAllPaymentMethods(params);
      
      return reply.send(result);
    } catch (error) {
      adminLogger.error({ err: error }, 'Error listing payment methods for admin');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch payment methods'
      });
    }
  });
  
  // GET /admin/payments/:id - Get payment details by ID (admin only)
  fastify.get('/admin/payments/:id', {
    schema: {
      tags: ['admin-payments'],
      description: 'Get payment details by ID (admin only)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Payment ID' }
        }
      },
      response: {
        200: {
          description: 'Payment details',
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Payment ID' },
            orderId: { type: 'string', description: 'Order ID' },
            userId: { type: 'string', description: 'User ID' },
            amount: { type: 'number', description: 'Payment amount' },
            currency: { type: 'string', description: 'Currency code' },
            status: { type: 'string', description: 'Payment status' },
            provider: { type: 'string', description: 'Payment provider' },
            paymentMethodId: { type: 'string', description: 'Payment method ID' },
            paymentMethod: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                brand: { type: 'string' },
                last4: { type: 'string' }
              }
            },
            refunds: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  amount: { type: 'number' },
                  status: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Update timestamp' }
          }
        },
        404: {
          description: 'Payment not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      adminLogger.info({ paymentId: id }, 'Admin requesting payment details');
      
      const payment = await paymentService.getPaymentById(id);
      
      if (!payment) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Payment not found'
        });
      }
      
      return reply.send(payment);
    } catch (error) {
      adminLogger.error({ err: error }, 'Error getting payment details for admin');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch payment details'
      });
    }
  });
  
  // GET /admin/payment-methods/:id - Get payment method details by ID (admin only)
  fastify.get('/admin/payment-methods/:id', {
    schema: {
      tags: ['admin-payment-methods'],
      description: 'Get payment method details by ID (admin only)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Payment method ID' }
        }
      },
      response: {
        200: {
          description: 'Payment method details',
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Payment method ID' },
            userId: { type: 'string', description: 'User ID' },
            type: { type: 'string', description: 'Payment method type' },
            provider: { type: 'string', description: 'Payment provider' },
            brand: { type: 'string', description: 'Card brand' },
            last4: { type: 'string', description: 'Last 4 digits' },
            expiryMonth: { type: 'string', description: 'Expiry month' },
            expiryYear: { type: 'string', description: 'Expiry year' },
            status: { type: 'string', description: 'Status' },
            isDefault: { type: 'boolean', description: 'Is default payment method' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Update timestamp' }
          }
        },
        404: {
          description: 'Payment method not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      adminLogger.info({ paymentMethodId: id }, 'Admin requesting payment method details');
      
      // For admin access, use the repository directly
      const paymentMethodRepo = fastify.db.getRepository(PaymentMethod);
      const paymentMethod = await paymentMethodRepo.findOne({ where: { id } });
      
      if (!paymentMethod) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Payment method not found'
        });
      }
      
      return reply.send(paymentMethod);
    } catch (error) {
      adminLogger.error({ err: error }, 'Error getting payment method details for admin');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch payment method details'
      });
    }
  });
} 