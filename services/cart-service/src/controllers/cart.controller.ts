import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CartService } from '../services/cart.service';
import { CartItemService } from '../services/cartItem.service';
import { createLogger } from '../utils/logger';
import { AuthenticationError } from '../utils/jwt';

// Request validation schemas
const addItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0),
});

const deviceIdHeader = 'x-device-id';

// Request parameter types
interface CartParams {
  id: string;
}

interface CartQuery {
  cartId: string;
}

export class CartController {
  private readonly logger = createLogger('CartController').child({ context: 'CartController' });

  constructor(
    private readonly cartService: CartService,
    private readonly cartItemService: CartItemService
  ) {}

  /**
   * Get cart for user or guest
   * GET /cart
   */
  async getCart(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = req.user?.userId || null;
      const deviceId = req.headers[deviceIdHeader] as string;

      let cart;
      if (userId) {
        cart = await this.cartService.getUserCart(userId);
      } else if (deviceId) {
        cart = await this.cartService.getGuestCart(deviceId);
      } else {
        reply.code(400).send({
          error: 'Either authentication or device-id header is required',
        });
        return;
      }

      reply.send(cart.toJSON());
    } catch (error: unknown) {
      this.handleError(error, reply);
    }
  }

  /**
   * Add item to cart
   * POST /cart/items
   */
  async addItem(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = req.user?.userId || null;
      const deviceId = req.headers[deviceIdHeader] as string;

      // Validate request body
      const validatedData = addItemSchema.parse(req.body);

      let cart;
      if (userId) {
        cart = await this.cartService.getUserCart(userId);
      } else if (deviceId) {
        cart = await this.cartService.getGuestCart(deviceId);
      } else {
        reply.code(400).send({
          error: 'Either authentication or device-id header is required',
        });
        return;
      }

      const item = await this.cartItemService.addItem(
        cart.id,
        userId,
        validatedData
      );

      reply.code(201).send(item.toJSON());
    } catch (error: unknown) {
      this.handleError(error, reply);
    }
  }

  /**
   * Update item quantity
   * PUT /cart/items/:id
   */
  async updateItem(
    req: FastifyRequest<{
      Params: CartParams;
      Querystring: CartQuery;
      Body: z.infer<typeof updateItemSchema>;
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = req.user?.userId || null;
      const itemId = req.params.id;
      const cartId = req.query.cartId;

      if (!cartId) {
        reply.code(400).send({ error: 'Cart ID is required' });
        return;
      }

      const { quantity } = req.body;

      const updatedItem = await this.cartItemService.updateQuantity(
        cartId,
        itemId,
        quantity,
        userId
      );

      if (!updatedItem) {
        reply.code(404).send({ error: 'Item not found' });
        return;
      }

      reply.send(updatedItem.toJSON());
    } catch (error: unknown) {
      this.handleError(error, reply);
    }
  }

  /**
   * Remove item from cart
   * DELETE /cart/items/:id
   */
  async removeItem(
    req: FastifyRequest<{
      Params: CartParams;
      Querystring: CartQuery;
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = req.user?.userId || null;
      const itemId = req.params.id;
      const cartId = req.query.cartId;

      if (!cartId) {
        reply.code(400).send({ error: 'Cart ID is required' });
        return;
      }

      await this.cartItemService.removeItem(cartId, itemId, userId);
      reply.code(204).send();
    } catch (error: unknown) {
      this.handleError(error, reply);
    }
  }

  /**
   * Merge guest cart into user cart
   * POST /cart/merge
   */
  async mergeCart(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { guestCartId } = req.body as { guestCartId: string };

      if (!userId) {
        reply.code(401).send({ error: 'Authentication required' });
        return;
      }

      if (!guestCartId) {
        reply.code(400).send({ error: 'Guest cart ID is required' });
        return;
      }

      await this.cartItemService.mergeCartItems(guestCartId, userId);
      const userCart = await this.cartService.getUserCart(userId);
      reply.send(userCart.toJSON());
    } catch (error: unknown) {
      this.handleError(error, reply);
    }
  }

  /**
   * Handle errors and send appropriate response
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof z.ZodError) {
      reply.code(400).send({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    if (error instanceof AuthenticationError) {
      reply.code(403).send({
        error: 'Access denied',
        message: error.message,
      });
      return;
    }

    // Log unexpected errors
    this.logger.error({ error }, 'Unexpected error in cart controller');

    reply.code(500).send({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 