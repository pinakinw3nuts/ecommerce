import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { createLogger } from '../utils/logger';

const logger = createLogger('validateRequest');

export const validateRequest = (schema: ZodSchema) => {
  return (req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    try {
      schema.parse(req.body);
      done();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ error, body: req.body }, 'Request validation failed');
        reply.code(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        logger.error({ error }, 'Unexpected validation error');
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred during validation',
        });
      }
    }
  };
};

/**
 * Convenience middleware for body validation only
 */
export const validateBody = (schema: ZodSchema) => {
  return validateRequest(schema);
};

/**
 * Convenience middleware for query validation only
 */
export const validateQuery = (schema: ZodSchema) => {
  return validateRequest(schema);
};

/**
 * Convenience middleware for params validation only
 */
export const validateParams = (schema: ZodSchema) => {
  return validateRequest(schema);
};

// Example usage:
/*
const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

router.post(
  '/cart/items',
  validateBody(cartItemSchema),
  cartController.addItem
);

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

router.get(
  '/products',
  validateQuery(querySchema),
  productController.list
);
*/ 