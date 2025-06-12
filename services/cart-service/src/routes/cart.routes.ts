import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { CartService } from '../services/cart.service';
import { CartItemService } from '../services/cartItem.service';
import { CartValidationService } from '../services/cart-validation.service';
import { createValidationMiddleware } from '../middleware/validation';
import { AppDataSource } from '../config/database';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { authGuard, attachUserIfPresent } from '../middleware/auth';

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
  total: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]),
  itemCount: z.number(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      productId: z.string().uuid(),
      variantId: z.string().uuid().nullable(),
      quantity: z.number(),
      price: z.union([
        z.number(),
        z.string().transform(val => Number(val))
      ]),
      productSnapshot: z.object({
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        variantName: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    })
  ).default([]),
  isCheckedOut: z.boolean(),
  createdAt: z.union([
    z.string(),
    z.date().transform(date => date.toISOString())
  ]),
  updatedAt: z.union([
    z.string(),
    z.date().transform(date => date.toISOString())
  ]),
  expiresAt: z.union([
    z.string(),
    z.date().transform(date => date.toISOString()),
    z.null()
  ]),
});

// Cart item response schema for individual item operations
const cartItemResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  quantity: z.number(),
  price: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]),
  total: z.number(),
  productSnapshot: z.object({
    name: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    variantName: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }).optional(),
  createdAt: z.union([
    z.string(),
    z.date().transform(date => date.toISOString())
  ]),
  updatedAt: z.union([
    z.string(),
    z.date().transform(date => date.toISOString())
  ]),
});

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.array(z.unknown()).optional(),
});

// Common schema components
const deviceIdHeaderSchema = {
  type: 'object',
  properties: {
    'x-device-id': { type: 'string' }
  }
};

// Standard response schema
const standardResponseSchema = {
  200: zodToJsonSchema(cartResponseSchema),
  400: zodToJsonSchema(errorResponseSchema),
  404: zodToJsonSchema(errorResponseSchema),
  500: zodToJsonSchema(errorResponseSchema),
};

// Cart item response schema
const itemResponseSchema = {
  200: zodToJsonSchema(cartItemResponseSchema),
  400: zodToJsonSchema(errorResponseSchema),
  404: zodToJsonSchema(errorResponseSchema),
  500: zodToJsonSchema(errorResponseSchema),
};

// Initialize repositories and services
const cartRepository = AppDataSource.getRepository(Cart);
const cartItemRepository = AppDataSource.getRepository(CartItem);
const cartService = new CartService(cartRepository, cartItemRepository);
const cartItemService = new CartItemService(cartItemRepository, cartService);

// Helper functions to reduce duplication
interface CartRequestContext {
  userId: string | null;
  deviceId: string | null;
  cartId?: string;
}

async function getCartContext(request: FastifyRequest): Promise<CartRequestContext> {
  // Get userId from authenticated user or null if not authenticated
  const userId = request.user?.userId || null;
  
  // Get deviceId from headers or query parameters
  const headerDeviceId = request.headers['x-device-id'] as string | undefined;
  const queryDeviceId = (request.query as any)?.['x-device-id'] as string | undefined;
  const deviceId = headerDeviceId || queryDeviceId || null;
  
  // Get cartId from query parameters if provided
  const cartId = (request.query as any)?.cartId;
  
  return { userId, deviceId, cartId };
}

async function getOrValidateCart(
  context: CartRequestContext,
  reply: FastifyReply
): Promise<Cart | null> {
  const { userId, deviceId, cartId } = context;
  
  // Validate we have enough info to identify a cart
  if (!cartId && !userId && !deviceId) {
    reply.code(400).send({
      error: 'Either cartId, authentication, or x-device-id is required',
      message: 'Please provide a cart ID, authenticate, or include a device ID header'
    });
    return null;
  }

  try {
    // If cartId is provided, use it directly
    if (cartId) {
      const cart = await cartService.getCartById(cartId, userId);
      
      if (!cart) {
        reply.code(404).send({ 
          error: 'Cart not found',
          message: 'The specified cart could not be found'
        });
        return null;
      }
      
      return cart;
    }
    
    // Otherwise get cart by user or device
    if (userId) {
      return await cartService.getUserCart(userId);
    } else if (deviceId) {
      return await cartService.getGuestCart(deviceId);
    } else {
      // This should never happen due to the validation above, but just in case
      reply.code(400).send({
        error: 'Missing identification',
        message: 'Either cartId, authentication, or x-device-id is required'
      });
      return null;
    }
  } catch (error) {
    throw error;
  }
}

async function refreshCartAndRespond(
  cart: Cart,
  userId: string | null,
  reply: FastifyReply,
  shouldRefreshProducts: boolean = false
): Promise<void> {
  try {
    // Fix prices for special products first
    await cartService.fixCartPrices(cart.id);
    
    // Refresh product data if cart has items and refresh is requested
    if (shouldRefreshProducts && cart.items && cart.items.length > 0) {
      await cartItemService.refreshProductData(cart.id, userId);
      const updatedCart = await cartService.getCartById(cart.id, userId);
      if (!updatedCart) {
        reply.code(404).send({ error: 'Cart not found after refresh' });
        return;
      }
      
      // Fix prices again after refresh to ensure they're correct
      await cartService.fixCartPrices(updatedCart.id);
      
      // Get the final cart with fixed prices
      const finalCart = await cartService.getCartById(updatedCart.id, userId);
      if (!finalCart) {
        reply.code(404).send({ error: 'Cart not found after price fixing' });
        return;
      }
      
      reply.send(finalCart.toJSON());
      return;
    }
    
    // If no items or refresh not requested, just calculate totals and respond
    const updatedCart = await cartService.getCartById(cart.id, userId);
    if (!updatedCart) {
      reply.code(404).send({ error: 'Cart not found after price fixing' });
      return;
    }
    
    updatedCart.calculateTotals();
    reply.send(updatedCart.toJSON());
  } catch (error) {
    throw error;
  }
}

const cartRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Initialize validation service with Fastify instance
  const cartValidationService = new CartValidationService(cartRepository, fastify);
  const validateCart = createValidationMiddleware(cartValidationService);
  
  // Add middleware to attach user if JWT token is present
  fastify.addHook('preHandler', attachUserIfPresent);

  // Get cart
  fastify.get<{
    Headers: { 'x-device-id'?: string },
    Querystring: { 'x-device-id'?: string, cartId?: string, refresh?: string }
  }>(
    '/cart',
    {
      schema: {
        tags: ['cart'],
        summary: 'Get current cart',
        description: 'Retrieves the current cart based on user authentication, device ID, or cart ID',
        headers: deviceIdHeaderSchema,
        querystring: {
          type: 'object',
          properties: {
            'x-device-id': { type: 'string' },
            'cartId': { type: 'string', format: 'uuid' },
            'refresh': { type: 'string', enum: ['true', 'false'] }
          }
        },
        response: standardResponseSchema,
      },
    },
    async (request, reply) => {
      try {
        const context = await getCartContext(request);
        const cart = await getOrValidateCart(context, reply);
        
        if (!cart) return; // Response already sent by getOrValidateCart
        
        // Try to query cart items directly if cart.items is empty
        if (!cart.items || cart.items.length === 0) {
          try {
            const cartItems = await cartItemRepository.find({
              where: { cartId: cart.id }
            });
            
            if (cartItems.length > 0) {
              cart.items = cartItems;
            }
          } catch (dbError) {
            request.log.error({ error: dbError }, 'Error querying cart items directly');
          }
        }
        
        // Check if refresh is explicitly requested
        const shouldRefresh = (request.query as any)?.refresh === 'true';
        await refreshCartAndRespond(cart, context.userId, reply, shouldRefresh);
      } catch (error) {
        request.log.error({ error }, 'Error retrieving cart');
        throw error;
      }
    }
  );

  // Add item to cart - consolidated endpoint handling both /cart and /cart/items
  fastify.post<{
    Body: z.infer<typeof addItemSchema>,
    Headers: { 'x-device-id'?: string },
    Querystring: { 'x-device-id'?: string }
  }>(
    '/cart/items',
    {
      schema: {
        tags: ['cart'],
        summary: 'Add item to cart',
        description: 'Adds a new item to the cart or increases quantity if item already exists',
        headers: deviceIdHeaderSchema,
        querystring: {
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
      const context = await getCartContext(request);
      
      if (!context.userId && !context.deviceId) {
        return reply.code(400).send({
          error: 'Authentication or device ID required',
          message: 'You must either be authenticated or provide a device ID (x-device-id) in headers or query parameters'
        });
      }

      try {
        const cart = await getOrValidateCart(context, reply);
        if (!cart) return; // Response already sent
        
        request.log.debug(
          { deviceId: context.deviceId, userId: context.userId, cartId: cart.id, requestBody: request.body }, 
          'Adding item to cart'
        );

        // Add item to the cart
        try {
          await cartItemService.addItem(
            cart.id,
            context.userId,
            request.body,
            context.deviceId
          );
          
          // Fetch updated cart to return
          const updatedCart = await cartService.getCartById(cart.id, context.userId);
          
          if (!updatedCart) {
            throw new Error('Cart not found after adding item');
          }

          return reply.code(201).send(updatedCart.toJSON());
        } catch (itemError) {
          request.log.error(
            { 
              error: itemError instanceof Error ? itemError.message : 'Unknown error',
              stack: itemError instanceof Error ? itemError.stack : undefined,
              cartId: cart.id,
              productId: request.body.productId
            }, 
            'Error adding item to cart'
          );
          
          // Return a more helpful error
          if (itemError instanceof Error) {
            return reply.code(500).send({ 
              error: 'Failed to add item to cart',
              message: itemError.message
            });
          }
          
          return reply.code(500).send({ 
            error: 'Failed to add item to cart',
            message: 'Unknown error occurred'
          });
        }
      } catch (error) {
        request.log.error({ error }, 'Error retrieving cart');
        throw error;
      }
    }
  );

  // Alias /cart to /cart/items for backward compatibility
  fastify.post<{
    Body: z.infer<typeof addItemSchema>,
    Headers: { 'x-device-id'?: string },
    Querystring: { 'x-device-id'?: string }
  }>(
    '/cart',
    {
      schema: {
        tags: ['cart'],
        summary: 'Add item to cart (alias)',
        description: 'Alias for POST /cart/items - adds a new item to the cart or increases quantity if item already exists',
        headers: deviceIdHeaderSchema,
        querystring: {
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
      // Forward to the /cart/items handler
      const context = await getCartContext(request);
      
      if (!context.userId && !context.deviceId) {
        return reply.code(400).send({
          error: 'Authentication or device ID required',
          message: 'You must either be authenticated or provide a device ID (x-device-id) in headers or query parameters'
        });
      }

      try {
        const cart = await getOrValidateCart(context, reply);
        if (!cart) return; // Response already sent
        
        // Add item to the cart
        try {
          await cartItemService.addItem(
            cart.id,
            context.userId,
            request.body,
            context.deviceId
          );
          
          // Fetch updated cart to return
          const updatedCart = await cartService.getCartById(cart.id, context.userId);
          
          if (!updatedCart) {
            throw new Error('Cart not found after adding item');
          }

          return reply.code(201).send(updatedCart.toJSON());
        } catch (itemError) {
          request.log.error(
            { 
              error: itemError instanceof Error ? itemError.message : 'Unknown error',
              stack: itemError instanceof Error ? itemError.stack : undefined,
              cartId: cart.id,
              productId: request.body.productId
            }, 
            'Error adding item to cart'
          );
          
          if (itemError instanceof Error) {
            return reply.code(500).send({ 
              error: 'Failed to add item to cart',
              message: itemError.message
            });
          }
          
          return reply.code(500).send({ 
            error: 'Failed to add item to cart',
            message: 'Unknown error occurred'
          });
        }
      } catch (error) {
        request.log.error({ error }, 'Error retrieving cart');
        throw error;
      }
    }
  );

  // Update item quantity
  fastify.put<{
    Params: { id: string },
    Querystring: { cartId?: string, 'x-device-id'?: string },
    Headers: { 'x-device-id'?: string },
    Body: z.infer<typeof updateItemSchema>
  }>(
    '/cart/items/:id',
    {
      schema: {
        tags: ['cart'],
        summary: 'Update cart item quantity',
        description: 'Updates the quantity of an item in the cart',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            cartId: { type: 'string', format: 'uuid' },
            'x-device-id': { type: 'string' }
          }
        },
        headers: deviceIdHeaderSchema,
        body: zodToJsonSchema(updateItemSchema),
        response: itemResponseSchema,
      },
    },
    async (request, reply) => {
      const context = await getCartContext(request);
      const { id: itemId } = request.params as { id: string };
      const { quantity } = request.body;

      try {
        // If cartId is not provided, get cart based on userId or deviceId
        if (!context.cartId) {
          const cart = await getOrValidateCart(context, reply);
          if (!cart) return; // Response already sent
          
          const updatedItem = await cartItemService.updateQuantity(
            cart.id,
            itemId,
            quantity,
            context.userId || null
          );

          if (!updatedItem) {
            return reply.code(404).send({ error: 'Item not found' });
          }

          return reply.send(updatedItem.toJSON());
        }
        
        // If cartId is provided, use it directly
        const updatedItem = await cartItemService.updateQuantity(
          context.cartId,
          itemId,
          quantity,
          context.userId || null
        );

        if (!updatedItem) {
          return reply.code(404).send({ error: 'Item not found' });
        }

        return reply.send(updatedItem.toJSON());
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Cart not found' || error.message === 'Item not found' || error.message === 'Item not found in cart') {
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

  // Delete item from cart
  fastify.delete<{
    Params: { id: string },
    Querystring: { cartId?: string, 'x-device-id'?: string },
    Headers: { 'x-device-id'?: string }
  }>(
    '/cart/items/:id',
    {
      schema: {
        tags: ['cart'],
        summary: 'Remove item from cart',
        description: 'Removes a specific item from the cart',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            cartId: { type: 'string', format: 'uuid' },
            'x-device-id': { type: 'string' }
          }
        },
        headers: deviceIdHeaderSchema,
        response: standardResponseSchema,
      },
    },
    async (request, reply) => {
      try {
        const context = await getCartContext(request);
        const { id: itemId } = request.params;
        
        request.log.info({ 
          itemId, 
          cartId: context.cartId, 
          userId: context.userId,
          deviceId: context.deviceId 
        }, 'Delete cart item request received');
        
        // If cartId is not provided, get cart based on userId or deviceId
        if (!context.cartId) {
          request.log.info('No cartId provided, looking up cart by user or device');
          const cart = await getOrValidateCart(context, reply);
          if (!cart) {
            request.log.error('Failed to get cart');
            return; // Response already sent
          }
          
          request.log.info({ cartId: cart.id, itemId }, 'Removing item from cart');
          try {
            const updatedCart = await cartService.removeItem(cart.id, itemId, context.userId);
            request.log.info({ 
              cartId: cart.id, 
              itemsRemaining: updatedCart.items.length 
            }, 'Item removed successfully');
            
            return reply.send(updatedCart.toJSON());
          } catch (removeError) {
            request.log.error({ 
              error: removeError instanceof Error ? removeError.message : 'Unknown error',
              cartId: cart.id,
              itemId 
            }, 'Error removing item from cart');
            
            if (removeError instanceof Error) {
              if (removeError.message.includes('Item not found')) {
                return reply.code(404).send({ error: removeError.message });
              }
            }
            
            return reply.code(500).send({ 
              error: 'Failed to remove item from cart',
              message: removeError instanceof Error ? removeError.message : 'Unknown error'
            });
          }
        }
        
        // If cartId is provided, use it directly
        request.log.info({ cartId: context.cartId, itemId }, 'Removing item using provided cartId');
        try {
          const updatedCart = await cartService.removeItem(
            context.cartId,
            itemId,
            context.userId
          );
          
          request.log.info({ 
            cartId: context.cartId, 
            itemsRemaining: updatedCart.items.length 
          }, 'Item removed successfully');
          
          return reply.send(updatedCart.toJSON());
        } catch (removeError) {
          request.log.error({ 
            error: removeError instanceof Error ? removeError.message : 'Unknown error',
            cartId: context.cartId,
            itemId 
          }, 'Error removing item from cart');
          
          if (removeError instanceof Error) {
            if (removeError.message.includes('Cart not found')) {
              return reply.code(404).send({ error: 'Cart not found' });
            }
            if (removeError.message.includes('Item not found')) {
              return reply.code(404).send({ error: 'Item not found' });
            }
            if (removeError.message.includes('Access denied')) {
              return reply.code(403).send({ error: 'Access denied to cart' });
            }
          }
          
          return reply.code(500).send({ 
            error: 'Failed to remove item from cart',
            message: removeError instanceof Error ? removeError.message : 'Unknown error'
          });
        }
      } catch (error) {
        request.log.error({ error }, 'Unexpected error in delete cart item endpoint');
        throw error;
      }
    }
  );

  // Clear cart
  fastify.delete<{
    Querystring: { cartId?: string, 'x-device-id'?: string },
    Headers: { 'x-device-id'?: string }
  }>(
    '/cart',
    {
      schema: {
        tags: ['cart'],
        summary: 'Clear cart',
        description: 'Removes all items from the cart',
        querystring: {
          type: 'object',
          properties: {
            cartId: { type: 'string', format: 'uuid' },
            'x-device-id': { type: 'string' }
          }
        },
        headers: deviceIdHeaderSchema,
        response: standardResponseSchema,
      },
    },
    async (request, reply) => {
      const context = await getCartContext(request);

      try {
        // If cartId is not provided, get cart based on userId or deviceId
        if (!context.cartId) {
          const cart = await getOrValidateCart(context, reply);
          if (!cart) return; // Response already sent
          
          const clearedCart = await cartService.clearCart(cart.id, context.userId);
          return reply.send(clearedCart.toJSON());
        }
        
        // If cartId is provided, use it directly
        const clearedCart = await cartService.clearCart(context.cartId, context.userId);
        return reply.send(clearedCart.toJSON());
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
        tags: ['cart'],
        summary: 'Merge guest cart with user cart',
        description: 'Merges items from a guest cart into the authenticated user\'s cart',
        body: zodToJsonSchema(mergeCartSchema),
        response: standardResponseSchema,
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
        return reply.send(mergedCart.toJSON());
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
        tags: ['cart'],
        summary: 'Validate cart',
        description: 'Validates cart items for availability and pricing',
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
        return reply.send(validation);
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

  // Refresh cart and fix prices
  fastify.post<{
    Headers: { 'x-device-id'?: string },
    Querystring: { 'x-device-id'?: string, cartId?: string }
  }>(
    '/cart/refresh',
    {
      schema: {
        tags: ['cart'],
        summary: 'Refresh cart data',
        description: 'Refreshes product data and fixes prices in the cart',
        headers: deviceIdHeaderSchema,
        querystring: {
          type: 'object',
          properties: {
            'x-device-id': { type: 'string' },
            'cartId': { type: 'string', format: 'uuid' }
          }
        },
        response: standardResponseSchema,
      },
    },
    async (request, reply) => {
      try {
        const context = await getCartContext(request);
        const cart = await getOrValidateCart(context, reply);
        
        if (!cart) return; // Response already sent by getOrValidateCart
        
        request.log.info({ 
          cartId: cart.id,
          userId: context.userId,
          deviceId: context.deviceId
        }, 'Refreshing cart and fixing prices');
        
        // Fix prices first
        await cartService.fixCartPrices(cart.id);
        
        // Then refresh product data
        await cartItemService.refreshProductData(cart.id, context.userId);
        
        // Fix prices again after refresh
        await cartService.fixCartPrices(cart.id);
        
        // Get the final cart
        const finalCart = await cartService.getCartById(cart.id, context.userId);
        if (!finalCart) {
          return reply.code(404).send({ error: 'Cart not found after refresh' });
        }
        
        return reply.send(finalCart.toJSON());
      } catch (error) {
        request.log.error({ error }, 'Error refreshing cart');
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