import { FastifyReply } from 'fastify';
import { WishlistService, PaginationOptions } from '../services/wishlist.service';
import { AuthenticatedRequest } from '../types/auth';
import { logger } from '../utils/logger';

/**
 * Request body for adding to wishlist
 */
interface AddToWishlistBody {
  productId: string;
  variantId?: string;
  productName?: string;
  productImage?: string;
  price?: number;
  metadata?: Record<string, any>;
}

/**
 * Request params for wishlist item operations
 */
interface WishlistItemParams {
  id: string;
}

/**
 * Request query for getting wishlist
 */
interface WishlistQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Controller for wishlist operations
 */
export class WishlistController {
  private wishlistService: WishlistService;

  constructor() {
    this.wishlistService = new WishlistService();
  }

  /**
   * Add a product to the wishlist
   */
  async addToWishlist(
    request: AuthenticatedRequest<{
      Body: AddToWishlistBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      const { productId, variantId, productName, productImage, price, metadata } = request.body;

      const wishlistItem = await this.wishlistService.addToWishlist({
        userId,
        productId,
        variantId,
        productName,
        productImage,
        price,
        metadata
      });

      return reply.status(201).send({
        message: 'Product added to wishlist',
        data: wishlistItem
      });
    } catch (error) {
      logger.error('Controller error: Failed to add to wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.user.id,
        productId: request.body.productId
      });

      return reply.status(500).send({
        message: 'Failed to add product to wishlist',
        error: 'WISHLIST_ADD_FAILED'
      });
    }
  }

  /**
   * Remove a product from the wishlist
   */
  async removeFromWishlist(
    request: AuthenticatedRequest<{
      Params: WishlistItemParams;
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      const { id } = request.params;

      // First, check if the item exists and belongs to the user
      const wishlistItem = await this.wishlistService.getWishlistItemById(id, userId);

      if (!wishlistItem) {
        return reply.status(404).send({
          message: 'Wishlist item not found',
          error: 'WISHLIST_ITEM_NOT_FOUND'
        });
      }

      // Remove the item using productId and variantId
      const removed = await this.wishlistService.removeFromWishlist(
        userId,
        wishlistItem.productId,
        wishlistItem.variantId || undefined
      );

      if (removed) {
        return reply.status(200).send({
          message: 'Product removed from wishlist',
          data: { id }
        });
      } else {
        return reply.status(404).send({
          message: 'Wishlist item not found',
          error: 'WISHLIST_ITEM_NOT_FOUND'
        });
      }
    } catch (error) {
      logger.error('Controller error: Failed to remove from wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.user.id,
        itemId: request.params.id
      });

      return reply.status(500).send({
        message: 'Failed to remove product from wishlist',
        error: 'WISHLIST_REMOVE_FAILED'
      });
    }
  }

  /**
   * Get user's wishlist
   */
  async getWishlist(
    request: AuthenticatedRequest<{
      Querystring: WishlistQuery;
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      const { page = '1', limit = '20', sortBy, order } = request.query;

      const paginationOptions: PaginationOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        order
      };

      const [items, total] = await this.wishlistService.getWishlist(
        userId,
        paginationOptions
      );

      return reply.status(200).send({
        message: 'Wishlist retrieved successfully',
        data: {
          items,
          pagination: {
            page: paginationOptions.page,
            limit: paginationOptions.limit,
            total,
            pages: Math.ceil(total / paginationOptions.limit)
          }
        }
      });
    } catch (error) {
      logger.error('Controller error: Failed to get wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.user.id
      });

      return reply.status(500).send({
        message: 'Failed to retrieve wishlist',
        error: 'WISHLIST_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Check if a product is in the wishlist
   */
  async checkWishlistItem(
    request: AuthenticatedRequest<{
      Querystring: {
        productId: string;
        variantId?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      const { productId, variantId } = request.query;

      const wishlistItem = await this.wishlistService.isInWishlist(
        userId,
        productId,
        variantId
      );

      return reply.status(200).send({
        message: 'Wishlist check completed',
        data: {
          inWishlist: !!wishlistItem,
          item: wishlistItem
        }
      });
    } catch (error) {
      logger.error('Controller error: Failed to check wishlist item', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.user.id,
        productId: request.query.productId
      });

      return reply.status(500).send({
        message: 'Failed to check if product is in wishlist',
        error: 'WISHLIST_CHECK_FAILED'
      });
    }
  }

  /**
   * Clear the entire wishlist
   */
  async clearWishlist(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      
      const removedCount = await this.wishlistService.clearWishlist(userId);

      return reply.status(200).send({
        message: 'Wishlist cleared successfully',
        data: {
          removedCount
        }
      });
    } catch (error) {
      logger.error('Controller error: Failed to clear wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.user.id
      });

      return reply.status(500).send({
        message: 'Failed to clear wishlist',
        error: 'WISHLIST_CLEAR_FAILED'
      });
    }
  }

  /**
   * Get wishlist count
   */
  async getWishlistCount(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      
      const count = await this.wishlistService.countWishlistItems(userId);

      return reply.status(200).send({
        message: 'Wishlist count retrieved successfully',
        data: {
          count
        }
      });
    } catch (error) {
      logger.error('Controller error: Failed to get wishlist count', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.user.id
      });

      return reply.status(500).send({
        message: 'Failed to get wishlist count',
        error: 'WISHLIST_COUNT_FAILED'
      });
    }
  }
} 