import { Repository } from 'typeorm';
import { FastifyInstance } from 'fastify';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { createLogger } from '../utils/logger';

export class CartValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'CartValidationError';
  }
}

export class CartValidationService {
  private readonly logger = createLogger('CartValidationService');
  private readonly productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
  private readonly inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003';

  constructor(
    private readonly cartRepository: Repository<Cart>,
    private readonly fastify: FastifyInstance
  ) {}

  /**
   * Validate entire cart
   */
  async validateCart(cartId: string): Promise<{ isValid: boolean; errors: string[] }> {
    this.logger.info({ cartId }, 'Validating cart');
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart) {
      this.logger.warn({ cartId }, 'Cart not found');
      throw new CartValidationError('Cart not found');
    }

    const errors: string[] = [];

    // Check cart expiration
    if (this.isCartExpired(cart)) {
      this.logger.warn({ cartId }, 'Cart has expired');
      errors.push('Cart has expired');
    }

    // Validate each item
    for (const item of cart.items) {
      try {
        await this.validateCartItem(item);
      } catch (error) {
        if (error instanceof CartValidationError) {
          this.logger.warn({ cartId, itemId: item.id, error: error.message }, 'Item validation failed');
          errors.push(`Item ${item.id}: ${error.message}`);
        }
      }
    }

    const result = {
      isValid: errors.length === 0,
      errors
    };
    
    this.logger.info({ cartId, result }, 'Cart validation completed');
    return result;
  }

  /**
   * Validate a single cart item
   */
  async validateCartItem(item: CartItem): Promise<void> {
    await Promise.all([
      this.validateStock(item),
      this.validatePrice(item)
    ]);
  }

  /**
   * Check if cart is expired
   */
  private isCartExpired(cart: Cart): boolean {
    if (!cart.expiresAt) return false;
    return new Date(cart.expiresAt) < new Date();
  }

  /**
   * Validate item stock availability
   */
  private async validateStock(item: CartItem): Promise<void> {
    try {
      const response = await this.fastify.inject({
        method: 'GET',
        url: `${this.inventoryServiceUrl}/api/v1/inventory/${item.productId}`,
        query: item.variantId ? { variantId: item.variantId } : undefined
      });

      if (response.statusCode === 404) {
        throw new CartValidationError('Product not found in inventory');
      }

      if (response.statusCode !== 200) {
        throw new CartValidationError('Error checking inventory');
      }

      const { availableStock } = response.json();

      if (availableStock < item.quantity) {
        throw new CartValidationError(
          'Insufficient stock',
          { availableStock, requestedQuantity: item.quantity }
        );
      }
    } catch (error) {
      if (error instanceof CartValidationError) {
        throw error;
      }
      throw new CartValidationError('Error checking inventory');
    }
  }

  /**
   * Validate item price against product service
   */
  private async validatePrice(item: CartItem): Promise<void> {
    try {
      const response = await this.fastify.inject({
        method: 'GET',
        url: `${this.productServiceUrl}/api/v1/products/${item.productId}`,
        query: item.variantId ? { variantId: item.variantId } : undefined
      });

      if (response.statusCode === 404) {
        throw new CartValidationError('Product not found');
      }

      if (response.statusCode !== 200) {
        throw new CartValidationError('Error validating price');
      }

      const { price } = response.json();

      // Allow for small floating point differences (e.g., 10.001 vs 10.00)
      if (Math.abs(price - item.price) > 0.01) {
        throw new CartValidationError(
          'Price mismatch',
          { currentPrice: price, cartPrice: item.price }
        );
      }
    } catch (error) {
      if (error instanceof CartValidationError) {
        throw error;
      }
      throw new CartValidationError('Error validating price');
    }
  }
} 