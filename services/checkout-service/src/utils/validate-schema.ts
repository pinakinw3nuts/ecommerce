import { z } from 'zod';
import { createError } from '@fastify/error';

const BadRequestError = createError('BAD_REQUEST', 'Validation failed', 400);

export function validateZodSchema<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      throw new BadRequestError(JSON.stringify({ errors }));
    }
    throw error;
  }
} 