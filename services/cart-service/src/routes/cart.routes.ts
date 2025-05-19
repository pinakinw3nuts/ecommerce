import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { CartService } from '../services/cart.service';
import { CartItemService } from '../services/cartItem.service';
import { CartValidationService } from '../services/cart-validation.service';
import { createValidationMiddleware } from '../middleware/validation';
import { AppDataSource } from '../config/database';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { authGuard } from '../middleware/auth';

// Request validation schemas
const addItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0),
});

const mergeCartSchema = z.object({
  guestCartId: z.string().uuid(),
});

// Response schemas for documentation
const cartResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  total: z.number(),
  itemCount: z.number(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      productId: z.string().uuid(),
      variantId: z.string().uuid().nullable(),
      quantity: z.number(),
      price: z.number(),
      productSnapshot: z.object({
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        variantName: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    })
  ),
  isCheckedOut: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string().nullable(),
});

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.array(z.unknown()).optional(),
});

// Initialize repositories and services
const cartRepository = AppDataSource.getRepository(Cart);
const cartItemRepository = AppDataSource.getRepository(CartItem);
const cartService = new CartService(cartRepository, cartItemRepository);
const cartItemService = new CartItemService(cartItemRepository, cartService);

const cartRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Initialize validation service with Fastify instance
  const cartValidationService = new CartValidationService(cartRepository, fastify);
  const validateCart = createValidationMiddleware(cartValidationService);

  // Get cart
  fastify.get(
    '/cart',
    {
      schema: {
        headers: {
          type: 'object',
          properties: {
            'x-device-id': { type: 'string' }
          }
        },
        response: {
          200: zodToJsonSchema(cartResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.userId || null;
      const deviceId = request.headers['x-device-id'] as string;

      if (!userId && !deviceId) {
        return reply.code(400).send({
          error: 'Either authentication or x-device-id header is required',
        });
      }

      const cart = userId
        ? await cartService.getUserCart(userId)
        : await cartService.getGuestCart(deviceId);

      return cart.toJSON();
    }
  );

  // Add item to cart
  fastify.post<{
    Body: z.infer<typeof addItemSchema>,
    Headers: { 'x-device-id'?: string }
  }>(
    '/cart/items',
    {
      schema: {
        headers: {
          type: 'object',
          properties: {
            'x-device-id': { type: 'string' }
          }
        },
        body: zodToJsonSchema(addItemSchema),
        response: {
          201: zodToJsonSchema(cartResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.userId || null;
      const deviceId = request.headers['x-device-id'] as string;

      if (!userId && !deviceId) {
        return reply.code(400).send({
          error: 'Either authentication or x-device-id header is required',
        });
      }

      const cart = userId
        ? await cartService.getUserCart(userId)
        : await cartService.getGuestCart(deviceId);

      const item = await cartItemService.addItem(
        cart.id,
        userId,
        request.body
      );

      return reply.code(201).send(item.toJSON());
    }
  );

  // Update item quantity
  fastify.put<{
    Params: { id: string },
    Querystring: { cartId: string },
    Body: z.infer<typeof updateItemSchema>
  }>(
    '/cart/items/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        querystring: {
          type: 'object',
          required: ['cartId'],
          properties: {
            cartId: { type: 'string', format: 'uuid' }
          }
        },
        body: zodToJsonSchema(updateItemSchema),
        response: {
          200: zodToJsonSchema(cartResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          404: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.userId || null;
      const { id: itemId } = request.params as { id: string };
      const { cartId } = request.query as { cartId: string };
      const { quantity } = request.body;

      const updatedItem = await cartItemService.updateQuantity(
        cartId,
        itemId,
        quantity,
        userId
      );

      if (!updatedItem) {
        return reply.code(404).send({ error: 'Item not found' });
      }

      return updatedItem.toJSON();
    }
  );

  // Delete item from cart
  fastify.delete<{
    Params: { id: string },
    Querystring: { cartId: string }
  }>(
    '/cart/items/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        querystring: {
          type: 'object',
          required: ['cartId'],
          properties: {
            cartId: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: zodToJsonSchema(cartResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          404: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.userId || null;
      const { id: itemId } = request.params;
      const { cartId } = request.query as { cartId: string };

      try {
        const updatedCart = await cartService.removeItem(cartId, itemId, userId);
        return updatedCart.toJSON();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Cart not found' || error.message === 'Item not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Access denied to cart') {
            return reply.code(403).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // Clear cart
  fastify.delete<{
    Querystring: { cartId: string }
  }>(
    '/cart',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['cartId'],
          properties: {
            cartId: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: zodToJsonSchema(cartResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          404: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.userId || null;
      const { cartId } = request.query as { cartId: string };

      try {
        const clearedCart = await cartService.clearCart(cartId, userId);
        return clearedCart.toJSON();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Cart not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Access denied to cart') {
            return reply.code(403).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // Merge guest cart with user cart
  fastify.post<{
    Body: z.infer<typeof mergeCartSchema>
  }>(
    '/cart/merge',
    {
      schema: {
        body: zodToJsonSchema(mergeCartSchema),
        response: {
          200: zodToJsonSchema(cartResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          404: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
      preHandler: [authGuard], // Require authentication for merging carts
    },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const { guestCartId } = request.body;

      try {
        const mergedCart = await cartService.mergeGuestCart(guestCartId, userId);
        return mergedCart.toJSON();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Guest cart not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Cart already merged') {
            return reply.code(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // Validate cart
  fastify.post<{
    Querystring: { cartId: string }
  }>(
    '/cart/validate',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['cartId'],
          properties: {
            cartId: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              isValid: { type: 'boolean' },
              errors: { 
                type: 'array',
                items: { type: 'string' }
              }
            }
          },
          400: zodToJsonSchema(errorResponseSchema),
          404: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const { cartId } = request.query as { cartId: string };
      
      try {
        const validation = await cartValidationService.validateCart(cartId);
        return validation;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Cart not found') {
            return reply.code(404).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // Add validation middleware to routes that need it
  fastify.addHook('preHandler', async (request, reply) => {
    const path = request.routerPath;
    const method = request.method;

    // Add validation for specific routes that modify cart
    const routesRequiringValidation = [
      { path: '/cart/items', method: 'POST' },
      { path: '/cart/items/:id', method: 'PUT' },
    ];

    if (routesRequiringValidation.some(route => 
      route.path === path && route.method === method
    )) {
      await validateCart(request, reply);
    }
  });
};

export default cartRoutes; 