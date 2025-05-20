import { FastifyRequest, FastifyReply, FastifyInstance, RouteShorthandOptions } from 'fastify'
import { RefundService } from '../services/refund.service'
import { validateRequest } from '../utils/validateRequest'
import { authGuard } from '../middleware/auth.guard'
import { z } from 'zod'
import { logger } from '../utils/logger'

const refundLogger = logger.child({ controller: 'RefundController' })

// Request body schema for creating refund
const createRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(10).max(500),
  metadata: z.record(z.unknown()).optional()
})

// Define route handler types
interface RefundParams {
  id?: string
}

interface RefundRouteGeneric {
  Body: z.infer<typeof createRefundSchema>
  Params: RefundParams
}

export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  async registerRoutes(fastify: FastifyInstance) {
    // Create refund (protected by authGuard)
    const createRefundOpts: RouteShorthandOptions = {
      preHandler: [authGuard],
      schema: {
        body: createRefundSchema
      }
    }
    
    fastify.post<RefundRouteGeneric>('/refunds', createRefundOpts, this.createRefund.bind(this))
    
    // Get refund by ID
    fastify.get<RefundRouteGeneric>('/refunds/:id', this.getRefundById.bind(this))
  }

  // POST /refunds - Create a new refund
  async createRefund(request: FastifyRequest<RefundRouteGeneric>, reply: FastifyReply) {
    try {
      if (!request.user) {
        throw new Error('User not authenticated')
      }

      const payload = validateRequest(request.body, createRefundSchema)
      
      refundLogger.info(
        { paymentId: payload.paymentId, amount: payload.amount },
        'Creating new refund'
      )
      
      const refund = await this.refundService.createRefund({
        paymentId: payload.paymentId,
        amount: payload.amount,
        reason: payload.reason,
        requestedBy: request.user.userId,
        ...(payload.metadata && { metadata: payload.metadata })
      })
      
      refundLogger.info(
        { refundId: refund.id, status: refund.status },
        'Refund created successfully'
      )
      
      return reply.status(201).send(refund)
    } catch (error: unknown) {
      refundLogger.error({ error }, 'Failed to create refund')
      
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

        const paymentId = request.body?.paymentId
        if (error.message === 'Payment not found' && paymentId) {
          return reply.status(404).send({
            error: 'Payment not found',
            message: `No payment found with ID: ${paymentId}`
          })
        }

        if (error.message === 'Payment cannot be refunded') {
          return reply.status(400).send({
            error: 'Invalid refund request',
            message: 'Payment cannot be refunded'
          })
        }

        if (error.message === 'Refund amount exceeds available amount') {
          return reply.status(400).send({
            error: 'Invalid refund amount',
            message: 'Refund amount exceeds available amount'
          })
        }
      }
      
      return reply.status(500).send({
        error: 'Failed to process refund',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // GET /refunds/:id - Get refund by ID
  async getRefundById(request: FastifyRequest<{ Params: RefundParams }>, reply: FastifyReply) {
    const { id } = request.params

    try {
      if (!id) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Refund ID is required'
        })
      }

      refundLogger.info({ refundId: id }, 'Fetching refund by ID')
      
      const refund = await this.refundService.getRefundById(id)
      
      if (!refund) {
        return reply.status(404).send({
          error: 'Refund not found',
          message: `No refund found with ID: ${id}`
        })
      }
      
      return reply.send(refund)
    } catch (error: unknown) {
      refundLogger.error({ error }, 'Failed to fetch refund')
      
      return reply.status(500).send({
        error: 'Failed to fetch refund',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
} 