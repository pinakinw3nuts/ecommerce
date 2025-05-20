import { FastifyInstance, RouteShorthandOptions } from 'fastify'
import { RefundService } from '../services/refund.service'
import { validateRequest } from '../utils/validateRequest'
import { authGuard } from '../middleware/auth.guard'
import { z } from 'zod'
import { logger } from '../utils/logger'

const refundLogger = logger.child({ module: 'RefundRoutes' })

// Request schemas
const createRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(10).max(500),
  metadata: z.record(z.unknown()).optional()
})

// Route parameter types
interface RefundRouteGeneric {
  Body: z.infer<typeof createRefundSchema>
  Params: {
    id?: string
  }
}

export async function refundRoutes(
  fastify: FastifyInstance,
  refundService: RefundService
) {
  // POST /refunds - Create refund request (requires authentication)
  const createRefundOpts: RouteShorthandOptions = {
    preHandler: [authGuard],
    schema: {
      body: createRefundSchema
    }
  }

  fastify.post<RefundRouteGeneric>('/refunds', createRefundOpts, async (request, reply) => {
    try {
      // Ensure request is authenticated
      if (!request.user) {
        throw new Error('User not authenticated')
      }

      const payload = validateRequest(request.body, createRefundSchema)
      
      refundLogger.info(
        { paymentId: payload.paymentId, amount: payload.amount },
        'Creating new refund request'
      )
      
      const refund = await refundService.createRefund({
        paymentId: payload.paymentId,
        amount: payload.amount,
        reason: payload.reason,
        requestedBy: request.user.userId,
        ...(payload.metadata && { metadata: payload.metadata })
      })
      
      refundLogger.info(
        { refundId: refund.id, status: refund.status },
        'Refund request created successfully'
      )
      
      return reply.status(201).send(refund)
    } catch (error: unknown) {
      refundLogger.error({ error }, 'Failed to create refund request')
      
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
            message: `No payment found with ID: ${request.body.paymentId}`
          })
        }

        if (error.message === 'Invalid refund amount') {
          return reply.status(400).send({
            error: 'Invalid refund amount',
            message: 'Refund amount cannot exceed the original payment amount'
          })
        }
      }
      
      return reply.status(500).send({
        error: 'Failed to process refund request',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // GET /refunds/:id - Get refund by ID (requires authentication)
  fastify.get<RefundRouteGeneric>('/refunds/:id', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      // Ensure request is authenticated
      if (!request.user) {
        throw new Error('User not authenticated')
      }

      const { id } = request.params
      
      if (!id) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Refund ID is required'
        })
      }
      
      refundLogger.info({ refundId: id }, 'Fetching refund details')
      
      const refund = await refundService.getRefundById(id)
      
      if (!refund) {
        return reply.status(404).send({
          error: 'Refund not found',
          message: `No refund found with ID: ${id}`
        })
      }
      
      return reply.send(refund)
    } catch (error: unknown) {
      refundLogger.error({ error }, 'Failed to fetch refund')
      
      if (error instanceof Error && error.message === 'User not authenticated') {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        })
      }
      
      return reply.status(500).send({
        error: 'Failed to fetch refund',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
} 