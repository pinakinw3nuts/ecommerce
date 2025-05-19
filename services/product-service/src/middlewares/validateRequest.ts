import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const data = source === 'body' ? request.body : request.query;
    const result = schema.safeParse(data);
    if (!result.success) {
      return reply.status(400).send({
        message: 'Validation failed',
        errors: result.error.flatten(),
      });
    }
    // Optionally, assign parsed data back to request
    if (source === 'body') request.body = result.data;
    else request.query = result.data;
  };
} 