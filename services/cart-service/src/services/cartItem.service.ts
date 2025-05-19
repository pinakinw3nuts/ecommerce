import { Repository } from 'typeorm';
import { CartItem } from '../entities/CartItem';
import { CartService } from './cart.service';
import { config } from '../config/env';
import { createLogger } from '../utils/logger';
import axios from 'axios';

interface ProductData {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  variants?: Array<{
    id: string;
    name: string;
    price?: number;
  }>;
}

export class CartItemService {
  private readonly logger = createLogger('CartItemService').child({ context: 'CartItemService' });
  private readonly productServiceUrl = config.productServiceUrl;

  constructor(
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly cartService: CartService
  ) {}

  /**
   * Add item to cart with product validation
   */
  async addItem(
    cartId: string,
    userId: string | null,
    data: {
      productId: string;
      variantId?: string;
      quantity: number;
    }
  ): Promise<CartItem> {
    try {
      // Validate product and get current price
      const productData = await this.getProductData(data.productId);
      if (!productData) {
        throw new Error('Product not found');
      }

      // Get variant price if specified
      let price = productData.price;
      let variantName: string | undefined;
      if (data.variantId && productData.variants) {
        const variant = productData.variants.find(v => v.id === data.variantId);
        if (!variant) {
          throw new Error('Product variant not found');
        }
        price = variant.price ?? price; // Use variant price if available
        variantName = variant.name;
      }

      // Create product snapshot
      const productSnapshot = {
        name: productData.name,
        description: productData.description,
        imageUrl: productData.imageUrl,
        variantName,
        metadata: {
          addedAt: new Date(),
          originalPrice: price,
        },
      };

      // Add item to cart
      const cart = await this.cartService.addItem(cartId, userId, {
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
        price,
        productSnapshot,
      });

      // Return the newly added item
      const newItem = cart.items.find(
        item =>
          item.productId === data.productId &&
          item.variantId === data.variantId
      );

      if (!newItem) {
        throw new Error('Failed to add item to cart');
      }

      return newItem;
    } catch (error: unknown) {
      this.logger.error(
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          cartId,
          productId: data.productId
        },
        'Failed to add item to cart'
      );
      throw error;
    }
  }

  /**
   * Update item quantity with validation
   */
  async updateQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
    userId: string | null
  ): Promise<CartItem | null> {
    try {
      const cart = await this.cartService.updateItemQuantity(
        cartId,
        itemId,
        quantity,
        userId
      );

      return cart.items.find(item => item.id === itemId) || null;
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          cartId,
          itemId
        },
        'Failed to update item quantity'
      );
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    cartId: string,
    itemId: string,
    userId: string | null
  ): Promise<void> {
    try {
      await this.cartService.removeItem(cartId, itemId, userId);
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          cartId,
          itemId
        },
        'Failed to remove item from cart'
      );
      throw error;
    }
  }

  /**
   * Merge items from guest cart to user cart
   */
  async mergeCartItems(guestCartId: string, userId: string): Promise<void> {
    try {
      await this.cartService.mergeGuestCart(guestCartId, userId);
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          guestCartId,
          userId
        },
        'Failed to merge guest cart items'
      );
      throw error;
    }
  }

  /**
   * Validate and refresh product data
   */
  async refreshProductData(cartId: string, userId: string | null): Promise<void> {
    try {
      const cart = await this.cartService.getCartById(cartId, userId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      const updates: Promise<void>[] = [];

      for (const item of cart.items) {
        updates.push(
          this.getProductData(item.productId).then(async productData => {
            if (!productData) {
              // Product no longer exists - mark item as unavailable
              item.productSnapshot = {
                ...item.productSnapshot,
                metadata: {
                  ...item.productSnapshot?.metadata,
                  unavailable: true,
                  lastChecked: new Date(),
                },
              };
            } else {
              // Update price and availability
              const variant = productData.variants?.find(
                v => v.id === item.variantId
              );
              const currentPrice = variant?.price ?? productData.price;

              item.productSnapshot = {
                name: productData.name,
                description: productData.description,
                imageUrl: productData.imageUrl,
                variantName: variant?.name,
                metadata: {
                  ...item.productSnapshot?.metadata,
                  lastChecked: new Date(),
                  priceChanged: currentPrice !== item.price,
                  currentPrice,
                },
              };
            }

            await this.cartItemRepository.save(item);
          })
        );
      }

      await Promise.all(updates);
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          cartId
        },
        'Failed to refresh product data for cart items'
      );
      throw error;
    }
  }

  /**
   * Get product data from product service
   */
  private async getProductData(productId: string): Promise<ProductData | null> {
    try {
      const response = await axios.get<ProductData>(
        `${this.productServiceUrl}/products/${productId}`
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          productId
        },
        'Failed to fetch product data'
      );
      throw error;
    }
  }
} 