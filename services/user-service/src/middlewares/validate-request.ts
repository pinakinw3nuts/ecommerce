import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import logger from '../utils/logger';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await schema.parseAsync({
        body: request.body,
        query: request.query,
        params: request.params
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error({ error: error.errors }, 'Validation error');
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors
        });
      }

      logger.error(error, 'Unexpected validation error');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  };
}; 