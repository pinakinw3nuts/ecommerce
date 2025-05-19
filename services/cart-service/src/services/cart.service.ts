import { Repository, LessThan } from 'typeorm';
import Redis from 'ioredis';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { config } from '../config/env';
import { createLogger } from '../utils/logger';
import { AuthenticationError } from '../utils/jwt';

export class CartService {
  private readonly logger = createLogger('CartService').child({ context: 'CartService' });
  private redis?: Redis;
  private readonly CART_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
  private readonly GUEST_CART_PREFIX = 'guest_cart:';
  private redisEnabled = false;

  constructor(
    private readonly cartRepository: Repository<Cart>,
    private readonly cartItemRepository: Repository<CartItem>
  ) {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection if configured
   */
  private initializeRedis(): void {
    if (!config.redisUrl) {
      this.logger.info('Redis URL not provided, running without cache');
      return;
    }

    try {
      this.redis = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.warn('Max Redis retry attempts reached, disabling Redis');
            this.disableRedis();
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        connectTimeout: 5000, // 5 second timeout
      });

      this.redis.on('connect', () => {
        this.logger.info('Redis connected successfully');
        this.redisEnabled = true;
      });

      this.redis.on('error', (err: Error) => {
        this.logger.error({ err }, 'Redis connection error');
        if (err.message.includes('ECONNREFUSED')) {
          this.logger.warn('Redis connection refused, disabling Redis');
          this.disableRedis();
        }
      });

      this.redis.on('close', () => {
        this.logger.warn('Redis connection closed');
        this.redisEnabled = false;
      });
    } catch (err) {
      this.logger.error({ err }, 'Failed to initialize Redis');
      this.disableRedis();
    }
  }

  /**
   * Disable Redis and cleanup
   */
  private disableRedis(): void {
    if (this.redis) {
      this.redis.disconnect();
      this.redis = undefined;
    }
    this.redisEnabled = false;
  }

  /**
   * Get cart by ID
   */
  async getCartById(cartId: string, userId?: string | null): Promise<Cart | null> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart) return null;

    // Check if user has access to this cart
    if (userId && cart.userId && cart.userId !== userId) {
      throw new AuthenticationError('Access denied to cart');
    }

    return cart;
  }

  /**
   * Get or create user cart
   */
  async getUserCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId, isCheckedOut: false },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        expiresAt: new Date(Date.now() + this.CART_TTL * 1000),
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  /**
   * Get or create guest cart
   */
  async getGuestCart(deviceId: string): Promise<Cart> {
    let cachedCartId: string | null = null;
    
    // Try to get from Redis if enabled
    if (this.redisEnabled && this.redis) {
      try {
        const redisKey = `${this.GUEST_CART_PREFIX}${deviceId}`;
        cachedCartId = await this.redis.get(redisKey);
      } catch (err) {
        this.logger.error({ err }, 'Error getting cart from Redis');
      }
    }

    if (cachedCartId) {
      const cart = await this.cartRepository.findOne({
        where: { id: cachedCartId, isCheckedOut: false },
        relations: ['items'],
      });
      if (cart) return cart;
    }

    // Create new guest cart
    const cart = this.cartRepository.create({
      metadata: { deviceId },
      expiresAt: new Date(Date.now() + this.CART_TTL * 1000),
    });
    await this.cartRepository.save(cart);

    // Cache the cart ID if Redis is enabled
    if (this.redisEnabled && this.redis) {
      try {
        const redisKey = `${this.GUEST_CART_PREFIX}${deviceId}`;
        await this.redis.set(redisKey, cart.id, 'EX', this.CART_TTL);
      } catch (err) {
        this.logger.error({ err }, 'Error caching cart in Redis');
      }
    }

    return cart;
  }

  /**
   * Add item to cart
   */
  async addItem(
    cartId: string,
    userId: string | null,
    data: {
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
      productSnapshot: CartItem['productSnapshot'];
    }
  ): Promise<Cart> {
    const cart = await this.getCartById(cartId, userId);
    if (!cart) throw new Error('Cart not found');

    // Check for existing item
    let item = cart.items.find(
      (i) => i.productId === data.productId && i.variantId === data.variantId
    );

    if (item) {
      // Update existing item
      item.quantity += data.quantity;
      item.price = data.price; // Update price in case it changed
      item.productSnapshot = data.productSnapshot;
      await this.cartItemRepository.save(item);
    } else {
      // Create new item
      item = this.cartItemRepository.create({
        cartId,
        ...data,
      });
      await this.cartItemRepository.save(item);
      cart.items.push(item);
    }

    cart.calculateTotals();
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
    userId: string | null
  ): Promise<Cart> {
    const cart = await this.getCartById(cartId, userId);
    if (!cart) throw new Error('Cart not found');

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found in cart');

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await this.cartItemRepository.remove(item);
      cart.items = cart.items.filter((i) => i.id !== itemId);
    } else {
      item.updateQuantity(quantity);
      await this.cartItemRepository.save(item);
    }

    cart.calculateTotals();
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    cartId: string,
    itemId: string,
    userId: string | null
  ): Promise<Cart> {
    const cart = await this.getCartById(cartId, userId);
    if (!cart) throw new Error('Cart not found');

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found in cart');

    await this.cartItemRepository.remove(item);
    cart.items = cart.items.filter((i) => i.id !== itemId);

    cart.calculateTotals();
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Clear cart
   */
  async clearCart(cartId: string, userId: string | null): Promise<Cart> {
    const cart = await this.getCartById(cartId, userId);
    if (!cart) throw new Error('Cart not found');

    await this.cartItemRepository.remove(cart.items);
    cart.items = [];
    cart.calculateTotals();
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Merge guest cart into user cart
   */
  async mergeGuestCart(guestCartId: string, userId: string): Promise<Cart> {
    const [guestCart, userCart] = await Promise.all([
      this.getCartById(guestCartId),
      this.getUserCart(userId),
    ]);

    if (!guestCart) throw new Error('Guest cart not found');

    // Move items from guest cart to user cart
    for (const item of guestCart.items) {
      await this.addItem(userCart.id, userId, {
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
        price: Number(item.price),
        productSnapshot: item.productSnapshot,
      });
    }

    // Clear and mark guest cart as checked out
    await this.clearCart(guestCart.id, null);
    guestCart.isCheckedOut = true;
    await this.cartRepository.save(guestCart);

    // Remove guest cart from Redis if enabled
    if (this.redisEnabled && this.redis && guestCart.metadata?.deviceId) {
      try {
        await this.redis.del(`${this.GUEST_CART_PREFIX}${guestCart.metadata.deviceId}`);
      } catch (err) {
        this.logger.error({ err }, 'Error removing guest cart from Redis');
      }
    }

    return this.getCartById(userCart.id, userId) as Promise<Cart>;
  }

  /**
   * Clean up expired carts
   */
  async cleanupExpiredCarts(): Promise<void> {
    try {
      const expiredCarts = await this.cartRepository.find({
        where: {
          expiresAt: LessThan(new Date()),
          isCheckedOut: false,
        },
      });

      for (const cart of expiredCarts) {
        await this.clearCart(cart.id, cart.userId);
        cart.isCheckedOut = true;
        await this.cartRepository.save(cart);

        // Clean up Redis if enabled
        if (this.redisEnabled && this.redis && cart.metadata?.deviceId) {
          try {
            await this.redis.del(`${this.GUEST_CART_PREFIX}${cart.metadata.deviceId}`);
          } catch (err) {
            this.logger.error({ err }, 'Error removing expired cart from Redis');
          }
        }
      }
    } catch (error) {
      this.logger.error({ error }, 'Error cleaning up expired carts');
    }
  }
} 