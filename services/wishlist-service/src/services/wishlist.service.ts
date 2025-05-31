import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Wishlist } from '../entities/Wishlist';
import { logger } from '../utils/logger';

/**
 * Interface for adding a product to the wishlist
 */
export interface AddToWishlistDto {
  userId: string;
  productId: string;
  variantId?: string;
  productName?: string;
  productImage?: string;
  price?: number;
  metadata?: Record<string, any>;
}

/**
 * Interface for pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Service for managing wishlist operations
 */
export class WishlistService {
  private wishlistRepository: Repository<Wishlist>;

  constructor() {
    this.wishlistRepository = AppDataSource.getRepository(Wishlist);
  }

  /**
   * Add a product to a user's wishlist
   * 
   * @param dto - Data for adding to wishlist
   * @returns The created wishlist item
   */
  async addToWishlist(dto: AddToWishlistDto): Promise<Wishlist> {
    try {
      // Check if the item already exists in the wishlist
      const existingItem = await this.isInWishlist(
        dto.userId,
        dto.productId,
        dto.variantId
      );

      if (existingItem) {
        logger.debug('Product already in wishlist', {
          userId: dto.userId,
          productId: dto.productId,
          variantId: dto.variantId
        });
        return existingItem;
      }

      // Create a new wishlist item
      const wishlistItem = new Wishlist();
      wishlistItem.userId = dto.userId;
      wishlistItem.productId = dto.productId;
      wishlistItem.variantId = dto.variantId;
      wishlistItem.productName = dto.productName;
      wishlistItem.productImage = dto.productImage;
      wishlistItem.price = dto.price;
      wishlistItem.metadata = dto.metadata || {};

      // Save the wishlist item
      const savedItem = await this.wishlistRepository.save(wishlistItem);
      logger.info('Product added to wishlist', {
        userId: dto.userId,
        productId: dto.productId,
        wishlistItemId: savedItem.id
      });

      return savedItem;
    } catch (error) {
      logger.error('Failed to add product to wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: dto.userId,
        productId: dto.productId
      });
      throw new Error('Failed to add product to wishlist');
    }
  }

  /**
   * Remove a product from a user's wishlist
   * 
   * @param userId - ID of the user
   * @param productId - ID of the product
   * @param variantId - Optional ID of the product variant
   * @returns True if removed, false if not found
   */
  async removeFromWishlist(
    userId: string,
    productId: string,
    variantId?: string
  ): Promise<boolean> {
    try {
      const result = await this.wishlistRepository.delete({
        userId,
        productId,
        variantId: variantId === undefined ? IsNull() : variantId
      });

      const removed = result.affected ? result.affected > 0 : false;
      
      if (removed) {
        logger.info('Product removed from wishlist', {
          userId,
          productId,
          variantId
        });
      } else {
        logger.debug('Product not found in wishlist for removal', {
          userId,
          productId,
          variantId
        });
      }

      return removed;
    } catch (error) {
      logger.error('Failed to remove product from wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        productId,
        variantId
      });
      throw new Error('Failed to remove product from wishlist');
    }
  }

  /**
   * Check if a product is in a user's wishlist
   * 
   * @param userId - ID of the user
   * @param productId - ID of the product
   * @param variantId - Optional ID of the product variant
   * @returns The wishlist item if found, null otherwise
   */
  async isInWishlist(
    userId: string,
    productId: string,
    variantId?: string
  ): Promise<Wishlist | null> {
    try {
      const wishlistItem = await this.wishlistRepository.findOne({
        where: {
          userId,
          productId,
          variantId: variantId === undefined ? IsNull() : variantId
        }
      });

      return wishlistItem;
    } catch (error) {
      logger.error('Failed to check if product is in wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        productId,
        variantId
      });
      throw new Error('Failed to check if product is in wishlist');
    }
  }

  /**
   * Get a user's wishlist with pagination
   * 
   * @param userId - ID of the user
   * @param options - Pagination options
   * @returns Array of wishlist items and total count
   */
  async getWishlist(
    userId: string,
    options: PaginationOptions
  ): Promise<[Wishlist[], number]> {
    try {
      const [items, total] = await this.wishlistRepository.findAndCount({
        where: { userId },
        order: {
          [options.sortBy || 'createdAt']: options.order || 'DESC'
        },
        skip: (options.page - 1) * options.limit,
        take: options.limit
      });

      logger.debug('Retrieved wishlist', {
        userId,
        itemCount: items.length,
        totalItems: total
      });

      return [items, total];
    } catch (error) {
      logger.error('Failed to get wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw new Error('Failed to get wishlist');
    }
  }

  /**
   * Get a specific wishlist item by ID
   * 
   * @param id - ID of the wishlist item
   * @param userId - ID of the user (for authorization)
   * @returns The wishlist item if found, null otherwise
   */
  async getWishlistItemById(
    id: string,
    userId: string
  ): Promise<Wishlist | null> {
    try {
      const wishlistItem = await this.wishlistRepository.findOne({
        where: { id, userId }
      });

      return wishlistItem;
    } catch (error) {
      logger.error('Failed to get wishlist item', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        userId
      });
      throw new Error('Failed to get wishlist item');
    }
  }

  /**
   * Clear all items from a user's wishlist
   * 
   * @param userId - ID of the user
   * @returns Number of items removed
   */
  async clearWishlist(userId: string): Promise<number> {
    try {
      const result = await this.wishlistRepository.delete({ userId });
      
      const removedCount = result.affected || 0;
      
      logger.info('Wishlist cleared', {
        userId,
        removedItems: removedCount
      });

      return removedCount;
    } catch (error) {
      logger.error('Failed to clear wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw new Error('Failed to clear wishlist');
    }
  }

  /**
   * Count items in a user's wishlist
   * 
   * @param userId - ID of the user
   * @returns Number of items in the wishlist
   */
  async countWishlistItems(userId: string): Promise<number> {
    try {
      const count = await this.wishlistRepository.count({
        where: { userId }
      });

      return count;
    } catch (error) {
      logger.error('Failed to count wishlist items', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw new Error('Failed to count wishlist items');
    }
  }
} 