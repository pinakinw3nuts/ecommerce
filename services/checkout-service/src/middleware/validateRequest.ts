import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodError } from 'zod';
import logger from '../utils/logger';

/**
 * Formats ZodError into a user-friendly error response
 */
const formatZodError = (error: ZodError) => {
  return {
    status: 'error',
    errors: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }))
  };
};

/**
 * Generic request validation middleware creator
 */
export const validateRequest = <T extends z.ZodTypeAny>(schema: T) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await schema.parseAsync(request);
      // Attach validated data to request for use in route handlers
      request.validated = result;
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({
          validation: formatZodError(error),
          path: request.url,
          method: request.method
        }, 'Request validation failed');

        reply.status(400).send(formatZodError(error));
        return reply;
      }
      throw error;
    }
  };
};

// Extend FastifyRequest to include validated data
declare module 'fastify' {
  interface FastifyRequest {
    validated: any;
  }
}

// Common validation schemas
export const schemas = {
  // Checkout session creation schema
  createCheckoutSession: z.object({
    body: z.object({
      cartId: z.string().uuid(),
      shippingAddress: z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        zipCode: z.string().min(1),
        country: z.string().min(1)
      }),
      billingAddress: z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        zipCode: z.string().min(1),
        country: z.string().min(1)
      }).optional(),
      paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL']),
      currency: z.string().length(3).default('USD'), // ISO 4217 currency code
      metadata: z.record(z.string()).optional()
    })
  }),

  // Order completion schema
  completeOrder: z.object({
    body: z.object({
      checkoutSessionId: z.string().uuid(),
      paymentIntentId: z.string(),
      paymentMethodId: z.string()
    })
  }),

  // Order status query schema
  getOrderStatus: z.object({
    params: z.object({
      orderId: z.string().uuid()
    })
  }),

  // Pagination query parameters schema
  paginationQuery: z.object({
    query: z.object({
      page: z.string().transform(Number).default('1'),
      limit: z.string()
        .transform(Number)
        .default('10')
        .refine(n => n <= 100, { message: 'Maximum limit is 100' })
    })
  }),

  // Date range query parameters schema
  dateRangeQuery: z.object({
    query: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional()
    })
  })
};

// Example usage:
/*
fastify.post('/checkout/session', {
  preHandler: [
    authGuard,
    validateRequest(schemas.createCheckoutSession)
  ],
  handler: async (request, reply) => {
    const { cartId, shippingAddress, paymentMethod } = request.validated.body;
    // ... handle checkout session creation
  }
});
*/ 