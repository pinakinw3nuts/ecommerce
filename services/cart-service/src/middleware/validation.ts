import { FastifyReply, FastifyRequest } from 'fastify';
import { CartValidationService, CartValidationError } from '../services/cart-validation.service';

export const createValidationMiddleware = (validationService: CartValidationService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const cartId = (request.query as any)?.cartId;
    
    if (!cartId) {
      return reply.code(400).send({
        error: 'Cart ID is required for validation'
      });
    }

    try {
      const validation = await validationService.validateCart(cartId);
      
      if (!validation.isValid) {
        return reply.code(400).send({
          error: 'Cart validation failed',
          details: validation.errors
        });
      }
    } catch (error) {
      if (error instanceof CartValidationError) {
        return reply.code(400).send({
          error: error.message,
          details: error.details
        });
      }
      throw error;
    }
  };
}; 