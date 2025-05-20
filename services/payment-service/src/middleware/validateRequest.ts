import { FastifyRequest, FastifyReply } from 'fastify'
import { z, ZodError, ZodSchema, ZodIssue } from 'zod'
import { logger } from '../utils/logger'

const validationLogger = logger.child({ module: 'RequestValidation' })

// Error response interface
interface ValidationErrorResponse {
  success: boolean
  error: string
  message: string
  details: {
    field: string
    message: string
  }[]
  timestamp: string
}

// Format Zod validation errors
const formatZodError = (error: ZodError): ValidationErrorResponse['details'] => {
  return error.errors.map((err: ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message
  }))
}

// Generic request validation middleware factory
export const validateRequest = <T extends ZodSchema>(schema: T) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Combine all request inputs for validation
      const dataToValidate = {
        body: request.body,
        query: request.query,
        params: request.params,
        headers: request.headers
      }

      // Validate against schema
      const validatedData = await schema.parseAsync(dataToValidate)

      // Attach validated data to request for use in route handlers
      request.body = validatedData.body
      request.query = validatedData.query
      request.params = validatedData.params

      validationLogger.debug('Request validation successful')
    } catch (error) {
      validationLogger.warn({ error }, 'Request validation failed')

      if (error instanceof ZodError) {
        const errorResponse: ValidationErrorResponse = {
          success: false,
          error: 'Validation Error',
          message: 'The request data failed validation',
          details: formatZodError(error),
          timestamp: new Date().toISOString()
        }

        return reply.code(400).send(errorResponse)
      }

      // Handle unexpected errors
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation',
        timestamp: new Date().toISOString()
      })
    }
  }
}

// Helper to create request schema with proper typing
export const createRequestSchema = <
  B extends ZodSchema = ZodSchema,
  Q extends ZodSchema = ZodSchema,
  P extends ZodSchema = ZodSchema
>(schemas: {
  body?: B
  query?: Q
  params?: P
}) => {
  return z.object({
    body: schemas.body ?? z.any(),
    query: schemas.query ?? z.any(),
    params: schemas.params ?? z.any(),
    headers: z.any() // Headers validation is optional
  })
}

// Example usage schemas
export const paymentRequestSchema = createRequestSchema({
  body: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3),
    paymentMethod: z.enum(['stripe', 'razorpay', 'cod', 'invoice']),
    orderId: z.string().uuid(),
    metadata: z.record(z.unknown()).optional()
  }),
  query: z.object({
    includeDetails: z.boolean().optional().default(false)
  })
})

export const refundRequestSchema = createRequestSchema({
  body: z.object({
    transactionId: z.string().uuid(),
    amount: z.number().positive(),
    reason: z.string().min(10).max(500),
    metadata: z.record(z.unknown()).optional()
  }),
  params: z.object({
    paymentId: z.string().uuid()
  })
})

// Export types for the schemas
export type PaymentRequest = z.infer<typeof paymentRequestSchema>
export type RefundRequest = z.infer<typeof refundRequestSchema>

// Export default validateRequest for simple usage
export default validateRequest 