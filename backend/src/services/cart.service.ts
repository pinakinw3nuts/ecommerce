import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Cart, CartMetadata } from '../entities/Cart';
import { CartItem, ProductSnapshot } from '../entities/CartItem';
import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';
import { logger } from '../utils/logger';

interface CartItemData {
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  productSnapshot: ProductSnapshot;
}

export interface AddItemToCartOptions {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface UpdateCartItemOptions {
  quantity: number;
}

export class CartService {
  private cartRepo: Repository<Cart>;
  private cartItemRepo: Repository<CartItem>;
  private productRepo: Repository<Product>;
  private variantRepo: Repository<ProductVariant>;

  constructor() {
    this.cartRepo = AppDataSource.getRepository(Cart);
    this.cartItemRepo = AppDataSource.getRepository(CartItem);
    this.productRepo = AppDataSource.getRepository(Product);
    this.variantRepo = AppDataSource.getRepository(ProductVariant);
  }

  /**
   * Get cart by user ID, create if doesn't exist
   */
  async getCart(userId: string): Promise<Cart> {
    logger.info('Getting cart for user:', { userId });

    let cart = await this.cartRepo.findOne({
      where: { userId, isCheckedOut: false },
      relations: ['items'],
    });

    if (!cart) {
      logger.info('Creating new cart for user:', { userId });
      cart = this.cartRepo.create({
        userId,
        total: 0,
        itemCount: 0,
        isCheckedOut: false,
        metadata: null,
        items: [],
      });
      cart = await this.cartRepo.save(cart);
    }

    // Calculate totals
    cart.calculateTotals();
    await this.cartRepo.save(cart);

    logger.info('Cart retrieved successfully:', { cartId: cart.id, userId, itemCount: cart.itemCount });
    return cart;
  }

  /**
   * Get cart by ID with optional user validation
   */
  async getCartById(cartId: string, userId?: string): Promise<Cart | null> {
    logger.info('Getting cart by ID:', { cartId, userId });

    const whereCondition: any = { id: cartId };
    if (userId) {
      whereCondition.userId = userId;
    }

    const cart = await this.cartRepo.findOne({
      where: whereCondition,
      relations: ['items'],
    });

    if (!cart) {
      logger.warn('Cart not found:', { cartId, userId });
      return null;
    }

    logger.info('Cart found:', { cartId: cart.id, userId: cart.userId });
    return cart;
  }

  /**
   * Add item to cart
   */
  async addItemToCart(userId: string, options: AddItemToCartOptions): Promise<Cart> {
    const { productId, variantId, quantity } = options;
    logger.info('Adding item to cart:', { userId, productId, variantId, quantity });

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Get or create cart
    const cart = await this.getCart(userId);

    // Get product information
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['category', 'brand', 'variants', 'images'],
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get variant information if specified
    let variant: ProductVariant | null = null;
    if (variantId) {
      variant = await this.variantRepo.findOne({
        where: { id: variantId },
        relations: ['product']
      });

      if (!variant) {
        throw new Error('Product variant not found');
      }
    }

    // Determine price (variant price takes precedence)
    const price = variant ? variant.price : product.price;

    // Create product snapshot
    const productSnapshot: ProductSnapshot = {
      name: product.name,
      description: product.description,
      imageUrl: product.images?.[0]?.url || undefined,
      additionalImages: product.images?.slice(1).map(img => img.url) || [],
      variantName: variant?.name || undefined,
      sku: variant?.sku || undefined,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
        logoUrl: product.brand.logoUrl || undefined,
      } : undefined,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
      } : undefined,
      attributes: {},
      dimensions: undefined,
      originalPrice: product.price,
      salePrice: variant?.price || product.salePrice || undefined,
      slug: product.slug,
      metadata: {},
    };

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => 
      item.productId === productId && 
      item.variantId === (variantId || null)
    );

    if (existingItem) {
      // Update existing item quantity
      existingItem.quantity += quantity;
      existingItem.productSnapshot = productSnapshot; // Update snapshot
      await this.cartItemRepo.save(existingItem);
      logger.info('Updated existing cart item:', { cartItemId: existingItem.id, newQuantity: existingItem.quantity });
    } else {
      // Create new cart item
      const cartItem = this.cartItemRepo.create({
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity,
        price,
        productSnapshot,
      });

      const savedItem = await this.cartItemRepo.save(cartItem);
      cart.items.push(savedItem);
      logger.info('Added new cart item:', { cartItemId: savedItem.id, productId, quantity });
    }

    // Recalculate totals and save cart
    cart.calculateTotals();
    await this.cartRepo.save(cart);

    logger.info('Item added to cart successfully:', { cartId: cart.id, totalItems: cart.itemCount, total: cart.total });
    return cart;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(userId: string, cartItemId: string, options: UpdateCartItemOptions): Promise<Cart> {
    const { quantity } = options;
    logger.info('Updating cart item:', { userId, cartItemId, quantity });

    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    // Get user's cart
    const cart = await this.getCart(userId);

    // Find cart item
    const cartItem = cart.items.find(item => item.id === cartItemId);
    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      await this.cartItemRepo.remove(cartItem);
      cart.items = cart.items.filter(item => item.id !== cartItemId);
      logger.info('Removed cart item:', { cartItemId });
    } else {
      // Update quantity
      cartItem.quantity = quantity;
      await this.cartItemRepo.save(cartItem);
      logger.info('Updated cart item quantity:', { cartItemId, newQuantity: quantity });
    }

    // Recalculate totals and save cart
    cart.calculateTotals();
    await this.cartRepo.save(cart);

    logger.info('Cart item updated successfully:', { cartId: cart.id, totalItems: cart.itemCount, total: cart.total });
    return cart;
  }

  /**
   * Remove cart item
   */
  async removeCartItem(userId: string, cartItemId: string): Promise<Cart> {
    logger.info('Removing cart item:', { userId, cartItemId });

    // Get user's cart
    const cart = await this.getCart(userId);

    // Find cart item
    const cartItem = cart.items.find(item => item.id === cartItemId);
    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    // Remove item
    await this.cartItemRepo.remove(cartItem);
    cart.items = cart.items.filter(item => item.id !== cartItemId);

    // Recalculate totals and save cart
    cart.calculateTotals();
    await this.cartRepo.save(cart);

    logger.info('Cart item removed successfully:', { cartId: cart.id, totalItems: cart.itemCount, total: cart.total });
    return cart;
  }

  /**
   * Clear cart (remove all items)
   */
  async clearCart(userId: string): Promise<Cart> {
    logger.info('Clearing cart for user:', { userId });

    const cart = await this.getCart(userId);

    if (cart.items.length > 0) {
      // Remove all cart items
      await this.cartItemRepo.remove(cart.items);
      cart.items = [];

      // Reset totals
      cart.total = 0;
      cart.itemCount = 0;
      await this.cartRepo.save(cart);
    }

    logger.info('Cart cleared successfully:', { cartId: cart.id, userId });
    return cart;
  }

  /**
   * Get cart summary (items count and total)
   */
  async getCartSummary(userId: string): Promise<{ itemCount: number; total: number }> {
    logger.info('Getting cart summary for user:', { userId });

    const cart = await this.getCart(userId);
    
    logger.info('Cart summary retrieved:', { userId, itemCount: cart.itemCount, total: cart.total });
    return {
      itemCount: cart.itemCount,
      total: Number(cart.total),
    };
  }

  /**
   * Validate cart items (check product availability, prices)
   */
  async validateCart(userId: string): Promise<{ isValid: boolean; issues: string[] }> {
    logger.info('Validating cart for user:', { userId });

    const cart = await this.getCart(userId);
    const issues: string[] = [];

    for (const item of cart.items) {
      // Check if product still exists
      const product = await this.productRepo.findOne({
        where: { id: item.productId },
        relations: ['variants'],
      });

      if (!product) {
        issues.push(`Product ${item.productSnapshot.name} is no longer available`);
        continue;
      }

      if (!product.isPublished) {
        issues.push(`Product ${item.productSnapshot.name} is no longer published`);
        continue;
      }

      // Check variant if applicable
      if (item.variantId) {
        const variant = product.variants?.find(v => v.id === item.variantId);
        if (!variant) {
          issues.push(`Variant for ${item.productSnapshot.name} is no longer available`);
          continue;
        }

        // Check price changes
        if (Number(item.price) !== Number(variant.price)) {
          issues.push(`Price for ${item.productSnapshot.name} has changed`);
        }
      } else {
        // Check product price changes
        if (Number(item.price) !== Number(product.price)) {
          issues.push(`Price for ${item.productSnapshot.name} has changed`);
        }
      }
    }

    const isValid = issues.length === 0;
    logger.info('Cart validation completed:', { userId, isValid, issuesCount: issues.length });

    return { isValid, issues };
  }

  /**
   * Merge guest cart with user cart (for when user logs in)
   */
  async mergeGuestCart(userId: string, guestCartId: string): Promise<Cart> {
    logger.info('Merging guest cart with user cart:', { userId, guestCartId });

    const guestCart = await this.cartRepo.findOne({
      where: { id: guestCartId, userId: undefined },
      relations: ['items'],
    });

    if (!guestCart || guestCart.items.length === 0) {
      logger.info('Guest cart not found or empty, returning user cart:', { guestCartId });
      return this.getCart(userId);
    }

    const userCart = await this.getCart(userId);

    // Add guest cart items to user cart
    for (const guestItem of guestCart.items) {
      // Check if item already exists in user cart
      const existingItem = userCart.items.find(item => 
        item.productId === guestItem.productId && 
        item.variantId === guestItem.variantId
      );

      if (existingItem) {
        // Merge quantities
        existingItem.quantity += guestItem.quantity;
        await this.cartItemRepo.save(existingItem);
        logger.info('Merged quantities for existing item:', { cartItemId: existingItem.id, totalQuantity: existingItem.quantity });
      } else {
        // Create new item in user cart
        const newItem = this.cartItemRepo.create({
          cartId: userCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          quantity: guestItem.quantity,
          price: guestItem.price,
          productSnapshot: guestItem.productSnapshot,
        });
        const savedItem = await this.cartItemRepo.save(newItem);
        userCart.items.push(savedItem);
        logger.info('Added guest item to user cart:', { cartItemId: savedItem.id });
      }
    }

    // Delete guest cart
    await this.cartRepo.remove(guestCart);

    // Recalculate totals and save user cart
    userCart.calculateTotals();
    await this.cartRepo.save(userCart);

    logger.info('Guest cart merged successfully:', { userId, userCartId: userCart.id, totalItems: userCart.itemCount });
    return userCart;
  }

  /**
   * Set cart expiration (useful for guest carts)
   */
  async setCartExpiration(cartId: string, expiresAt: Date): Promise<void> {
    logger.info('Setting cart expiration:', { cartId, expiresAt });

    await this.cartRepo.update(cartId, { expiresAt });

    logger.info('Cart expiration set successfully:', { cartId, expiresAt });
  }

  /**
   * Clean up expired carts
   */
  async cleanupExpiredCarts(): Promise<number> {
    logger.info('Cleaning up expired carts');

    const expiredCarts = await this.cartRepo.find({
      where: {
        expiresAt: new Date(),
      },
    });

    if (expiredCarts.length > 0) {
      await this.cartRepo.remove(expiredCarts);
      logger.info('Expired carts cleaned up:', { count: expiredCarts.length });
    }

    return expiredCarts.length;
  }
}