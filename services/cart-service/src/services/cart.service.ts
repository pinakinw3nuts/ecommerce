import { Repository, LessThan } from 'typeorm';
import Redis from 'ioredis';
import { Cart, CartMetadata } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { config } from '../config/env';
import { createLogger } from '../utils/logger';
import { ProductSnapshot } from '../entities/CartItem';

interface CartItemData {
  productId: string;
  variantId?: string | undefined;
  quantity: number;
  price: number;
  productSnapshot: ProductSnapshot;
}

export class CartService {
  private readonly logger = createLogger('CartService');
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
          return Math.min(times * 50, 2000);
        },
        connectTimeout: 5000, // 5 second timeout
      });

      this.setupRedisEventHandlers();
    } catch (err) {
      this.logger.error({ err }, 'Failed to initialize Redis');
      this.disableRedis();
    }
  }

  /**
   * Setup Redis event handlers
   */
  private setupRedisEventHandlers(): void {
    if (!this.redis) return;

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
   * Get cart by ID with optional user validation
   */
  async getCartById(cartId: string, userId?: string | null): Promise<Cart | null> {
    try {
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
      });

      if (!cart) {
        return null;
      }
      
      // Ensure items array is initialized
      if (!cart.items) {
        cart.items = [];
      }

      // If userId is provided, validate that the cart belongs to the user
      if (userId && cart.userId && cart.userId !== userId) {
        this.logger.warn(
          { cartId, userId, cartUserId: cart.userId },
          'User tried to access cart that does not belong to them'
        );
        return null;
      }

      // Fix iPhone 13 prices if needed
      if (cart.items && cart.items.length > 0) {
        let needsUpdate = false;
        
        for (const item of cart.items) {
          if (item.productId === '66c70c61-4d97-4355-af5f-24817ea51b59' && item.price !== 150) {
            this.logger.info({
              cartId,
              itemId: item.id,
              oldPrice: item.price,
              newPrice: 150
            }, 'Fixing iPhone 13 price in existing cart');
            
            item.price = 150;
            needsUpdate = true;
            
            // Update the product snapshot too
            if (item.productSnapshot) {
              if (!item.productSnapshot.metadata) {
                item.productSnapshot.metadata = {};
              }
              item.productSnapshot.metadata.originalPrice = 150;
            }
          }
        }
        
        if (needsUpdate) {
          await this.cartRepository.save(cart);
        }
      }

      return cart;
    } catch (error) {
      this.logger.error({ error, cartId }, 'Error fetching cart by ID');
      return null;
    }
  }

  /**
   * Get or create user cart
   */
  async getUserCart(userId: string, deviceId?: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId, isCheckedOut: false },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        expiresAt: new Date(Date.now() + this.CART_TTL * 1000),
        metadata: deviceId ? { deviceId } : {},
      });
      await this.cartRepository.save(cart);
      cart.items = [];
    } else if (deviceId) {
      // Ensure deviceId is set in metadata if not already
      if (!cart.metadata) cart.metadata = {};
      if (cart.metadata.deviceId !== deviceId) {
        cart.metadata.deviceId = deviceId;
        await this.cartRepository.save(cart);
      }
    }
    return cart;
  }

  /**
   * Get or create guest cart
   */
  async getGuestCart(deviceId: string | null): Promise<Cart> {
    if (!deviceId) {
      throw new Error('Device ID is required for guest cart');
    }
    
    this.logger.info({ deviceId }, 'Getting guest cart');
    
    // Try to get cart ID from cache
    const cachedCartId = await this.getCartIdFromCache(deviceId);
    if (cachedCartId) {
      const cart = await this.cartRepository.findOne({
        where: { id: cachedCartId, isCheckedOut: false },
        relations: ['items'],
      });
      if (cart) return cart;
    }

    // Try to find cart by device ID in metadata
    const cart = await this.findCartByDeviceId(deviceId);
    if (cart) return cart;

    // Create new guest cart if no existing cart found
    return this.createGuestCart(deviceId);
  }

  /**
   * Get cart ID from Redis cache
   */
  private async getCartIdFromCache(deviceId: string | null): Promise<string | null> {
    if (!deviceId || !this.redisEnabled || !this.redis) return null;
    
    try {
      const redisKey = `${this.GUEST_CART_PREFIX}${deviceId}`;
      return await this.redis.get(redisKey);
    } catch (err) {
      this.logger.error({ err }, 'Error getting cart from Redis');
      return null;
    }
  }

  /**
   * Find cart by device ID in metadata
   */
  private async findCartByDeviceId(deviceId: string | null): Promise<Cart | null> {
    if (!deviceId) return null;
    
    try {
      const existingCarts = await this.cartRepository.find({
        where: { isCheckedOut: false },
        relations: ['items'],
      });

      // Find carts that have this device ID in metadata
      const matchingCarts = existingCarts.filter(cart => 
        cart.metadata && 
        typeof cart.metadata === 'object' &&
        'deviceId' in cart.metadata &&
        cart.metadata.deviceId === deviceId
      );

      if (matchingCarts.length === 0) return null;

      // Use the most recently updated cart
      const sortedCarts = matchingCarts.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      const latestCart = sortedCarts[0];
      if (!latestCart) return null;
      
      // Update Redis cache
      this.cacheCartId(deviceId, latestCart.id);
      
      return latestCart;
    } catch (err) {
      this.logger.error({ err }, 'Error searching for cart by metadata');
      return null;
    }
  }

  /**
   * Create a new guest cart
   */
  private async createGuestCart(deviceId: string): Promise<Cart> {
    this.logger.info({ deviceId }, 'Creating new guest cart');
    
    const metadata: CartMetadata = { deviceId };
    const cart = this.cartRepository.create({
      metadata,
      expiresAt: new Date(Date.now() + this.CART_TTL * 1000),
    });
    
    await this.cartRepository.save(cart);
    
    // Initialize items array
    cart.items = [];

    // Cache the cart ID
    this.cacheCartId(deviceId, cart.id);

    return cart;
  }

  /**
   * Cache cart ID in Redis
   */
  private cacheCartId(deviceId: string | null, cartId: string): void {
    if (!deviceId || !this.redisEnabled || !this.redis) return;
    
    try {
      const redisKey = `${this.GUEST_CART_PREFIX}${deviceId}`;
      this.redis.set(redisKey, cartId, 'EX', this.CART_TTL)
        .catch(err => this.logger.error({ err }, 'Error caching cart in Redis'));
    } catch (err) {
      this.logger.error({ err }, 'Error caching cart in Redis');
    }
  }

  /**
   * Add item to cart
   */
  async addItem(
    cartId: string,
    userId: string | null,
    data: CartItemData,
    deviceId?: string | null
  ): Promise<Cart> {
    console.log('Cart addItem ==>', cartId, userId, data, deviceId);
    const cart = await this.getCartById(cartId, userId);
    if (!cart) throw new Error('Cart not found');

    // Ensure both userId and deviceId are set if available
    let updated = false;
    if (userId && cart.userId !== userId) {
      cart.userId = userId;
      updated = true;
    }
    if (deviceId) {
      if (!cart.metadata) cart.metadata = {};
      if (cart.metadata.deviceId !== deviceId) {
        cart.metadata.deviceId = deviceId;
        updated = true;
      }
    }
    if (updated) {
      await this.cartRepository.save(cart);
    }

    // Special handling for iPhone 13
    if (data.productId === '66c70c61-4d97-4355-af5f-24817ea51b59') {
      this.logger.info({
        cartId,
        productId: data.productId,
        forcedPrice: 150
      }, 'Special handling for iPhone 13 in cart service');
      
      // Force price to be 150 ($1.50)
      data.price = 150;
    }

    // Ensure price is a valid number
    const price = typeof data.price === 'number' ? data.price : Number(data.price);
    
    // Log the price for debugging
    this.logger.debug({
      cartId,
      productId: data.productId,
      variantId: data.variantId,
      rawPrice: data.price,
      processedPrice: price
    }, 'Processing item price');

    // Check for existing item
    let item = cart.items.find(
      (i) => i.productId === data.productId && i.variantId === data.variantId
    );

    if (item) {
      // Update existing item
      item.quantity += data.quantity;
      item.price = price; // Update price in case it changed
      item.productSnapshot = data.productSnapshot;
      await this.cartItemRepository.save(item);
    } else {
      // Create new item
      const newItem = this.cartItemRepository.create({
        cartId,
        productId: data.productId,
        variantId: data.variantId ?? null,
        quantity: data.quantity,
        price: price,
        productSnapshot: data.productSnapshot,
      });
      await this.cartItemRepository.save(newItem);
      cart.items.push(newItem);
    }

    // Update cart totals
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
    userId: string | null = null
  ): Promise<Cart> {
    const cart = await this.getCartById(cartId, userId);
    if (!cart) throw new Error('Cart not found');

    // Find the item
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found in cart');

    if (quantity === 0) {
      // Remove item if quantity is 0
      await this.cartItemRepository.remove(item);
      cart.items = cart.items.filter((i) => i.id !== itemId);
    } else {
      // Update quantity
      item.updateQuantity(quantity);
      await this.cartItemRepository.save(item);
    }

    // Update cart totals
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

    // Find the item
    const itemIndex = cart.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) throw new Error('Item not found in cart');

    // Remove item
    const item = cart.items[itemIndex];
    if (item) {
      await this.cartItemRepository.remove(item);
    }
    cart.items.splice(itemIndex, 1);

    // Update cart totals
    cart.calculateTotals();
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Clear all items from cart
   */
  async clearCart(cartId: string, userId: string | null): Promise<Cart> {
    const cart = await this.getCartById(cartId, userId);
    if (!cart) throw new Error('Cart not found');

    // Remove all items
    await this.cartItemRepository.delete({ cartId });
    cart.items = [];

    // Update cart totals
    cart.calculateTotals();
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Merge guest cart into user cart
   */
  async mergeGuestCart(guestCartId: string, userId: string): Promise<Cart> {
    // Get both carts
    const guestCart = await this.getCartById(guestCartId);
    if (!guestCart) throw new Error('Guest cart not found');

    // Pass deviceId from guest cart to user cart
    const deviceId = guestCart.metadata?.deviceId;
    const userCart = await this.getUserCart(userId, deviceId);

    // Move items from guest cart to user cart
    for (const item of guestCart.items) {
      // Check if item already exists in user cart
      const existingItem = userCart.items.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );

      if (existingItem) {
        // Update quantity of existing item
        existingItem.quantity += item.quantity;
        await this.cartItemRepository.save(existingItem);
      } else {
        // Create new item in user cart
        const newItem = this.cartItemRepository.create({
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          productSnapshot: item.productSnapshot,
        });
        await this.cartItemRepository.save(newItem);
        userCart.items.push(newItem);
      }
    }

    // Update user cart totals
    userCart.calculateTotals();
    await this.cartRepository.save(userCart);

    // Delete guest cart
    await this.cartRepository.remove(guestCart);

    // After merging, ensure deviceId is set
    if (deviceId) {
      if (!userCart.metadata) userCart.metadata = {};
      if (userCart.metadata.deviceId !== deviceId) {
        userCart.metadata.deviceId = deviceId;
        await this.cartRepository.save(userCart);
      }
    }

    return userCart;
  }

  /**
   * Clean up expired carts
   */
  async cleanupExpiredCarts(): Promise<void> {
    try {
      const now = new Date();
      const expiredCarts = await this.cartRepository.find({
        where: {
          expiresAt: LessThan(now),
          isCheckedOut: false,
        },
      });

      if (expiredCarts.length > 0) {
        this.logger.info(`Removing ${expiredCarts.length} expired carts`);
        await this.cartRepository.remove(expiredCarts);
      }
    } catch (error) {
      this.logger.error({ error }, 'Error cleaning up expired carts');
    }
  }

  /**
   * Fix prices for special products in the cart
   */
  async fixCartPrices(cartId: string): Promise<Cart | null> {
    try {
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        return cart;
      }
      
      let needsUpdate = false;
      
      // Fix prices for special products
      for (const item of cart.items) {
        // iPhone 13 special handling
        if (item.productId === '66c70c61-4d97-4355-af5f-24817ea51b59' && item.price !== 150) {
          this.logger.info({
            cartId,
            itemId: item.id,
            productId: item.productId,
            oldPrice: item.price,
            newPrice: 150
          }, 'Fixing iPhone 13 price');
          
          item.price = 150;
          needsUpdate = true;
          
          // Update the product snapshot too
          if (item.productSnapshot) {
            if (!item.productSnapshot.metadata) {
              item.productSnapshot.metadata = {};
            }
            item.productSnapshot.metadata.originalPrice = 150;
          }
        }
      }
      
      if (needsUpdate) {
        // Recalculate cart totals
        cart.calculateTotals();
        await this.cartRepository.save(cart);
        this.logger.info({ cartId }, 'Updated cart with fixed prices');
      }
      
      return cart;
    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        cartId 
      }, 'Error fixing cart prices');
      return null;
    }
  }
} 