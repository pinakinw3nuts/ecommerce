import { FastifyInstance, RouteShorthandOptions } from 'fastify'
import { PaymentService } from '../services/payment.service'
import { PaymentStatus } from '../entities/payment.entity'
import { validateRequest } from '../utils/validateRequest'
import { authGuard, AuthRequest } from '../middleware/auth.guard'
import { z } from 'zod'
import { logger } from '../utils/logger'

const paymentLogger = logger.child({ module: 'PaymentRoutes' })

// Request schemas
const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3), // e.g., 'USD', 'EUR'
  paymentMethodId: z.string().uuid()
})

const updatePaymentStatusSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  metadata: z.record(z.unknown()).optional()
})

const getUserPaymentsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(Number).default('1'),
    limit: z.string().optional().transform(Number).default('10'),
    status: z.nativeEnum(PaymentStatus).optional()
  })
})

const refundPaymentSchema = z.object({
  amount: z.number().positive().optional()
})

const processPaymentSchema = z.object({
  paymentMethodId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  orderId: z.string().uuid(),
  description: z.string().optional()
})

// Route parameter types
interface PaymentRouteGeneric {
  Body: z.infer<typeof createPaymentSchema> | z.infer<typeof updatePaymentStatusSchema>
  Params: {
    orderId?: string
    id?: string
  }
}

interface GetUserPaymentsOptions {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
}

// Extend FastifyInstance to include paymentService
declare module 'fastify' {
  interface FastifyInstance {
    paymentService: PaymentService;
  }
  interface FastifyRequest {
    user?: {
      userId: string;
    };
  }
}

export async function paymentRoutes(fastify: FastifyInstance) {
  const paymentService = fastify.paymentService;

  // POST /payments - Create payment (requires authentication)
  const createPaymentOpts: RouteShorthandOptions = {
    preHandler: [authGuard],
    schema: {
      tags: ['payments'],
      description: 'Create a new payment',
      body: {
        type: 'object',
        required: ['orderId', 'amount', 'currency', 'paymentMethodId'],
        properties: {
          orderId: { type: 'string', format: 'uuid', description: 'ID of the order' },
          amount: { type: 'number', minimum: 0, description: 'Payment amount' },
          currency: { type: 'string', minLength: 3, maxLength: 3, description: 'Currency code (e.g. USD, EUR)' },
          paymentMethodId: { type: 'string', format: 'uuid', description: 'ID of the payment method' }
        }
      },
      response: {
        201: {
          description: 'Successfully created payment',
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Payment ID' },
            status: { type: 'string', description: 'Payment status' },
            amount: { type: 'number', description: 'Payment amount' },
            currency: { type: 'string', description: 'Currency code' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      },
      security: [
        { bearerAuth: [] }
      ]
    }
  }

  fastify.post<PaymentRouteGeneric>('/payments', createPaymentOpts, async (request, reply) => {
    try {
      // Ensure request is authenticated
      if (!request.user) {
        throw new Error('User not authenticated')
      }

      const payload = validateRequest(request.body, createPaymentSchema)
      
      paymentLogger.info(
        { orderId: payload.orderId, amount: payload.amount },
        'Creating new payment'
      )
      
      const payment = await paymentService.createPayment({
        ...payload,
        userId: request.user.userId // Use authenticated user's ID
      })
      
      paymentLogger.info(
        { paymentId: payment.id, status: payment.status },
        'Payment created successfully'
      )
      
      return reply.status(201).send(payment)
    } catch (error: unknown) {
      paymentLogger.error({ error }, 'Failed to create payment')
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors
        })
      }
      
      if (error instanceof Error && error.message === 'User not authenticated') {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        })
      }
      
      return reply.status(500).send({
        error: 'Failed to process payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // PUT /payments/:id/status - Update payment status (requires authentication)
  const updateStatusOpts: RouteShorthandOptions = {
    preHandler: [authGuard],
    schema: {
      tags: ['payments'],
      description: 'Update payment status',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Payment ID' }
        }
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { 
            type: 'string', 
            enum: Object.values(PaymentStatus),
            description: 'New payment status'
          },
          metadata: { 
            type: 'object',
            additionalProperties: true,
            description: 'Additional payment metadata'
          }
        }
      },
      response: {
        200: {
          description: 'Successfully updated payment',
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Payment ID' },
            status: { type: 'string', description: 'Updated payment status' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Update timestamp' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Payment not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      },
      security: [
        { bearerAuth: [] }
      ]
    }
  }

  fastify.put<PaymentRouteGeneric>('/payments/:id/status', updateStatusOpts, async (request, reply) => {
    try {
      // Ensure request is authenticated
      if (!request.user) {
        throw new Error('User not authenticated')
      }

      const { id } = request.params
      if (!id) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Payment ID is required'
        })
      }

      const payload = validateRequest(request.body, updatePaymentStatusSchema)
      
      paymentLogger.info(
        { paymentId: id, newStatus: payload.status },
        'Updating payment status'
      )
      
      const payment = await paymentService.updatePaymentStatus(
        id,
        payload.status,
        {
          ...payload.metadata,
          updatedBy: request.user.userId,
          updatedAt: new Date()
        }
      )
      
      paymentLogger.info(
        { paymentId: payment.id, status: payment.status },
        'Payment status updated successfully'
      )
      
      return reply.send(payment)
    } catch (error: unknown) {
      paymentLogger.error({ error }, 'Failed to update payment status')
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors
        })
      }
      
      if (error instanceof Error) {
        if (error.message === 'User not authenticated') {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          })
        }

        if (error.message === 'Payment not found') {
          return reply.status(404).send({
            error: 'Payment not found',
            message: `No payment found with ID: ${request.params.id}`
          })
        }
      }
      
      return reply.status(500).send({
        error: 'Failed to update payment status',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // GET /payments/:orderId - Get payment by order ID (public endpoint)
  fastify.get<PaymentRouteGeneric>('/payments/:orderId', {
    schema: {
      tags: ['payments'],
      description: 'Get payments by order ID',
      params: {
        type: 'object',
        required: ['orderId'],
        properties: {
          orderId: { type: 'string', format: 'uuid', description: 'Order ID' }
        }
      },
      response: {
        200: {
          description: 'List of payments for the order',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Payment ID' },
              orderId: { type: 'string', description: 'Order ID' },
              amount: { type: 'number', description: 'Payment amount' },
              currency: { type: 'string', description: 'Currency code' },
              status: { type: 'string', description: 'Payment status' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
            }
          }
        },
        404: {
          description: 'Payments not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { orderId } = request.params
      
      if (!orderId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Order ID is required'
        })
      }
      
      paymentLogger.info({ orderId }, 'Fetching payment by order ID')
      
      const payments = await paymentService.getPaymentsByOrderId(orderId)
      
      if (!payments.length) {
        return reply.status(404).send({
          error: 'Payment not found',
          message: `No payments found for order ID: ${orderId}`
        })
      }
      
      return reply.send(payments)
    } catch (error: unknown) {
      paymentLogger.error({ error }, 'Failed to fetch payment')
      
      return reply.status(500).send({
        error: 'Failed to fetch payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Get user payments
  fastify.get<{
    Querystring: z.infer<typeof getUserPaymentsSchema>['query'];
    Params: { userId: string };
  }>('/user/:userId', {
    schema: {
      tags: ['payments'],
      description: 'Get payments for a specific user',
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', format: 'uuid', description: 'User ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          status: { 
            type: 'string', 
            enum: Object.values(PaymentStatus),
            description: 'Filter by payment status'
          }
        }
      },
      response: {
        200: {
          description: 'List of user payments',
          type: 'object',
          properties: {
            payments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Payment ID' },
                  orderId: { type: 'string', description: 'Order ID' },
                  amount: { type: 'number', description: 'Payment amount' },
                  status: { type: 'string', description: 'Payment status' },
                  createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer', description: 'Total number of payments' },
                page: { type: 'integer', description: 'Current page' },
                limit: { type: 'integer', description: 'Items per page' },
                pages: { type: 'integer', description: 'Total pages' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { page, limit, status } = request.query;
    const options: GetUserPaymentsOptions = {};
    
    if (page) {
      options.page = page;
    }
    if (limit) {
      options.limit = limit;
    }
    if (status) {
      options.status = status;
    }

    const payments = await paymentService.getUserPayments(request.params.userId, options);
    reply.send(payments);
  });

  // Refund payment
  fastify.post<{
    Params: { id: string };
    Body: z.infer<typeof refundPaymentSchema>;
  }>('/:id/refund', {
    schema: {
      tags: ['payments'],
      description: 'Create a refund for a payment',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Payment ID to refund' }
        }
      },
      body: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0, description: 'Refund amount (optional, defaults to full amount)' }
        }
      },
      response: {
        200: {
          description: 'Refund processed successfully',
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Refund ID' },
            paymentId: { type: 'string', description: 'Original payment ID' },
            amount: { type: 'number', description: 'Refunded amount' },
            status: { type: 'string', description: 'Refund status' },
            createdAt: { type: 'string', format: 'date-time', description: 'Refund timestamp' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Payment not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const refund = await paymentService.refundPayment(
      request.params.id,
      request.body.amount
    );
    reply.send(refund);
  });

  // Example of updating one route handler
  fastify.post<{
    Body: z.infer<typeof processPaymentSchema>;
  }>('/process', {
    preHandler: [authGuard],
    schema: {
      tags: ['payments'],
      description: 'Process a payment with payment provider',
      body: {
        type: 'object',
        required: ['paymentMethodId', 'amount', 'currency', 'orderId'],
        properties: {
          paymentMethodId: { type: 'string', format: 'uuid', description: 'Payment method ID' },
          amount: { type: 'number', minimum: 0, description: 'Payment amount' },
          currency: { type: 'string', minLength: 3, maxLength: 3, description: 'Currency code (e.g., USD, EUR)' },
          orderId: { type: 'string', format: 'uuid', description: 'Order ID' },
          description: { type: 'string', description: 'Payment description (optional)' }
        }
      },
      response: {
        200: {
          description: 'Payment processed successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Success flag' },
            data: {
              type: 'object',
              properties: {
                transactionId: { type: 'string', description: 'Transaction ID from the payment processor' },
                status: { 
                  type: 'string',
                  enum: Object.values(PaymentStatus),
                  description: 'Payment status'
                },
                message: { type: 'string', description: 'Status message' }
              }
            }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      },
      security: [
        { bearerAuth: [] }
      ]
    }
  }, async (request, reply) => {
    const routeLogger = logger.child({ handler: 'processPayment' })
    
    try {
      // Type assertion for authorized request
      const authRequest = request as AuthRequest;
      
      if (!authRequest.user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        })
      }
      
      const paymentData = {
        ...request.body,
        userId: authRequest.user.userId // Use authenticated user's ID
      }
      
      // Add proper type handling or implement the method in PaymentService
      const result = await (paymentService as any).processPayment(paymentData)
      
      return reply.status(200).send({
        success: true,
        data: {
          transactionId: result.transactionId,
          status: result.status,
          message: result.message
        }
      })
    } catch (error: unknown) {
      routeLogger.error({ error }, 'Failed to process payment')
      
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing the payment';
      
      return reply.status(statusCode).send({
        success: false,
        error: statusCode === 500 ? 'Internal Server Error' : 'Payment Processing Failed',
        message: errorMessage
      })
    }
  })
} 