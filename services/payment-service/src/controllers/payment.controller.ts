import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { PaymentService } from '../services/payment.service'
import { PaymentStatus } from '../entities/payment.entity'
import { validateRequest } from '../utils/validateRequest'
import { z } from 'zod'
import { logger } from '../utils/logger'

const paymentLogger = logger.child({ controller: 'PaymentController' })

// Request body schema for creating payment
const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3), // e.g., 'USD', 'EUR'
  paymentMethodId: z.string().uuid()
})

// Request body schema for updating payment status
const updatePaymentStatusSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  metadata: z.record(z.unknown()).optional()
})

// Route parameter types
interface PaymentParams {
  orderId?: string
  id?: string
}

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  async registerRoutes(fastify: FastifyInstance) {
    // Create payment
    fastify.post('/payments', this.createPayment.bind(this))
    
    // Get payment by order ID
    fastify.get('/payments/:orderId', this.getPaymentByOrderId.bind(this))
    
    // Update payment status
    fastify.put('/payments/:id/status', this.updatePaymentStatus.bind(this))
  }

  // POST /payments - Create a new payment
  private async createPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        throw new Error('User not authenticated')
      }

      const payload = validateRequest(request.body, createPaymentSchema)
      
      paymentLogger.info({ orderId: payload.orderId }, 'Creating new payment')
      
      const payment = await this.paymentService.createPayment({
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
  }

  // GET /payments/:orderId - Get payment by order ID
  private async getPaymentByOrderId(request: FastifyRequest<{ Params: PaymentParams }>, reply: FastifyReply) {
    try {
      const { orderId } = request.params
      
      if (!orderId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Order ID is required'
        })
      }
      
      paymentLogger.info({ orderId }, 'Fetching payment by order ID')
      
      const payments = await this.paymentService.getPaymentsByOrderId(orderId)
      
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
  }

  // PUT /payments/:id/status - Update payment status
  private async updatePaymentStatus(request: FastifyRequest<{ Params: PaymentParams }>, reply: FastifyReply) {
    const { id } = request.params
    
    try {
      if (!request.user) {
        throw new Error('User not authenticated')
      }

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
      
      const payment = await this.paymentService.updatePaymentStatus(
        id,
        payload.status,
        payload.metadata
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
            message: `No payment found with ID: ${id}`
          })
        }
      }
      
      return reply.status(500).send({
        error: 'Failed to update payment status',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
} 