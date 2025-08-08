import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CartService } from '../services/cart.service';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { requireUser } from '../middleware/auth';

const cartService = new CartService();

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to format cart response
function formatCartResponse(cart: any) {
  return cart.toJSON();
}

// Zod schemas for validation
const addItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  variantId: z.string().uuid('Invalid variant ID format').optional().nullable(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

const mergeGuestCartSchema = z.object({
  guestCartId: z.string().uuid('Invalid guest cart ID format'),
});

export default async function cartRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all cart routes
  fastify.addHook('preHandler', requireUser());

  // GET /api/cart - Get user's cart
  fastify.get('/', {
    schema: {
      tags: ['Cart'],
      summary: 'Get current user cart',
      response: { 200: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object' } } } }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      logger.info('Getting cart for user:', { userId: user.userId });

      const cart = await cartService.getCart(user.userId);
      
      return reply.send({
        success: true,
        data: formatCartResponse(cart),
      });
    } catch (error) {
      logger.error('Error getting cart:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get cart',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // GET /api/cart/summary - Get cart summary (item count and total)
  fastify.get('/summary', {
    schema: {
      tags: ['Cart'],
      summary: 'Get cart summary',
      response: { 200: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object' } } } }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      logger.info('Getting cart summary for user:', { userId: user.userId });

      const summary = await cartService.getCartSummary(user.userId);
      
      return reply.send({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Error getting cart summary:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get cart summary',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // POST /api/cart/items - Add item to cart
  fastify.post('/items', {
    schema: {
      tags: ['Cart'],
      summary: 'Add item to cart',
      body: { type: 'object', required: ['productId','quantity'], properties: { productId: { type: 'string' }, variantId: { type: 'string' }, quantity: { type: 'number' } } },
      response: { 201: { type: 'object' } }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const itemData = addItemSchema.parse(request.body);
      
      // Ensure required properties are provided
      if (!itemData.productId || !itemData.quantity) {
        return reply.status(400).send({
          success: false,
          message: 'Product ID and quantity are required',
          error: 'MISSING_REQUIRED_FIELDS',
        });
      }
      
      logger.info('Adding item to cart:', { userId: user.userId, itemData });

      const cart = await cartService.addItemToCart(user.userId, {
        productId: itemData.productId,
        variantId: itemData.variantId,
        quantity: itemData.quantity,
      });
      
      return reply.status(201).send({
        success: true,
        message: 'Item added to cart successfully',
        data: formatCartResponse(cart),
      });
    } catch (error) {
      logger.error('Error adding item to cart:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid request data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: error.message,
          error: 'NOT_FOUND',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to add item to cart',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // PUT /api/cart/items/:id - Update cart item quantity
  fastify.put('/items/:id', {
    schema: {
      tags: ['Cart'],
      summary: 'Update cart item quantity',
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      body: { type: 'object', required: ['quantity'], properties: { quantity: { type: 'number' } } }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const { id: cartItemId } = request.params;
      const updateData = updateItemSchema.parse(request.body);
      
      // Ensure required properties are provided
      if (!updateData.quantity) {
        return reply.status(400).send({
          success: false,
          message: 'Quantity is required',
          error: 'MISSING_REQUIRED_FIELDS',
        });
      }
      
      if (!isValidUUID(cartItemId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid cart item ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Updating cart item:', { userId: user.userId, cartItemId, updateData });

      const cart = await cartService.updateCartItem(user.userId, cartItemId, {
        quantity: updateData.quantity,
      });
      
      return reply.send({
        success: true,
        message: 'Cart item updated successfully',
        data: formatCartResponse(cart),
      });
    } catch (error) {
      logger.error('Error updating cart item:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid request data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: error.message,
          error: 'NOT_FOUND',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update cart item',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // DELETE /api/cart/items/:id - Remove item from cart
  fastify.delete('/items/:id', {
    schema: {
      tags: ['Cart'],
      summary: 'Remove item from cart',
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const { id: cartItemId } = request.params;
      
      if (!isValidUUID(cartItemId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid cart item ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Removing cart item:', { userId: user.userId, cartItemId });

      const cart = await cartService.removeCartItem(user.userId, cartItemId);
      
      return reply.send({
        success: true,
        message: 'Cart item removed successfully',
        data: formatCartResponse(cart),
      });
    } catch (error) {
      logger.error('Error removing cart item:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: error.message,
          error: 'NOT_FOUND',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to remove cart item',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // DELETE /api/cart - Clear cart (remove all items)
  fastify.delete('/', {
    schema: {
      tags: ['Cart'],
      summary: 'Clear cart',
      response: { 200: { type: 'object' } }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      logger.info('Clearing cart for user:', { userId: user.userId });

      const cart = await cartService.clearCart(user.userId);
      
      return reply.send({
        success: true,
        message: 'Cart cleared successfully',
        data: formatCartResponse(cart),
      });
    } catch (error) {
      logger.error('Error clearing cart:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to clear cart',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // POST /api/cart/validate - Validate cart items (check availability, prices)
  fastify.post('/validate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      logger.info('Validating cart for user:', { userId: user.userId });

      const validation = await cartService.validateCart(user.userId);
      
      return reply.send({
        success: true,
        data: validation,
      });
    } catch (error) {
      logger.error('Error validating cart:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to validate cart',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // POST /api/cart/merge-guest - Merge guest cart with user cart
  fastify.post('/merge-guest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const { guestCartId } = mergeGuestCartSchema.parse(request.body);
      
      logger.info('Merging guest cart:', { userId: user.userId, guestCartId });

      const cart = await cartService.mergeGuestCart(user.userId, guestCartId);
      
      return reply.send({
        success: true,
        message: 'Guest cart merged successfully',
        data: formatCartResponse(cart),
      });
    } catch (error) {
      logger.error('Error merging guest cart:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid request data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to merge guest cart',
        error: 'INTERNAL_ERROR',
      });
    }
  });
}