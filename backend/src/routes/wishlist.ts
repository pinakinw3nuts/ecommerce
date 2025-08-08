import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WishlistService, PaginationOptions } from '../services/wishlist.service';
import { requireUser } from '../middleware/auth';
import { logger } from '../utils/logger';

const wishlistService = new WishlistService();

// Validation schemas
const AddToWishlistSchema = {
  type: 'object',
  required: ['productId'],
  properties: {
    productId: { type: 'string', format: 'uuid' },
    variantId: { type: 'string', format: 'uuid' },
    productName: { type: 'string' },
    productImage: { type: 'string', format: 'uri' },
    price: { type: 'number', minimum: 0.01 },
    metadata: { type: 'object' }
  }
};

const WishlistQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'string', default: '1' },
    limit: { type: 'string', default: '20' },
    sortBy: { type: 'string', enum: ['createdAt', 'productName', 'price'] },
    order: { type: 'string', enum: ['ASC', 'DESC'] }
  }
};

const CheckWishlistSchema = {
  type: 'object',
  required: ['productId'],
  properties: {
    productId: { type: 'string', format: 'uuid' },
    variantId: { type: 'string', format: 'uuid' }
  }
};

const WishlistItemParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' }
  }
};

export async function wishlistRoutes(fastify: FastifyInstance) {
  // Add product to wishlist
  fastify.post('/', {
    schema: {
      tags: ['Wishlist'],
      summary: 'Add a product to the wishlist',
      description: 'Add a product to the authenticated user\'s wishlist',
      body: AddToWishlistSchema,
      response: {
        201: {
          description: 'Product added to wishlist',
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        400: {
          description: 'Validation error',
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'object' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    preHandler: [requireUser]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const { productId, variantId, productName, productImage, price, metadata } = request.body as any;

      const wishlistItem = await wishlistService.addToWishlist({
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
      logger.error('Failed to add to wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (request.user as any)?.id,
        productId: (request.body as any)?.productId
      });

      return reply.status(500).send({
        message: 'Failed to add product to wishlist',
        error: 'WISHLIST_ADD_FAILED'
      });
    }
  });

  // Remove product from wishlist
  fastify.delete('/:id', {
    schema: {
      tags: ['Wishlist'],
      summary: 'Remove a product from the wishlist',
      description: 'Remove a product from the authenticated user\'s wishlist',
      params: WishlistItemParamsSchema,
      response: {
        200: {
          description: 'Product removed from wishlist',
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        404: {
          description: 'Wishlist item not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    preHandler: [requireUser]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const { id } = request.params as any;

      // First, check if the item exists and belongs to the user
      const wishlistItem = await wishlistService.getWishlistItemById(id, userId);

      if (!wishlistItem) {
        return reply.status(404).send({
          message: 'Wishlist item not found',
          error: 'WISHLIST_ITEM_NOT_FOUND'
        });
      }

      // Remove the item using productId and variantId
      const removed = await wishlistService.removeFromWishlist(
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
      logger.error('Failed to remove from wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (request.user as any)?.id,
        itemId: (request.params as any)?.id
      });

      return reply.status(500).send({
        message: 'Failed to remove product from wishlist',
        error: 'WISHLIST_REMOVE_FAILED'
      });
    }
  });

  // Get user's wishlist
  fastify.get('/', {
    schema: {
      tags: ['Wishlist'],
      summary: 'Get user\'s wishlist',
      description: 'Get the authenticated user\'s wishlist with pagination',
      querystring: WishlistQuerySchema,
      response: {
        200: {
          description: 'Wishlist retrieved successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array' },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'number' },
                    limit: { type: 'number' },
                    total: { type: 'number' },
                    pages: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    preHandler: [requireUser]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const { page = 1, limit = 20, sortBy, order } = request.query as any;

      const paginationOptions: PaginationOptions = {
        page,
        limit,
        sortBy,
        order
      };

      const [items, total] = await wishlistService.getWishlist(
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
      logger.error('Failed to get wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (request.user as any)?.id
      });

      return reply.status(500).send({
        message: 'Failed to retrieve wishlist',
        error: 'WISHLIST_RETRIEVAL_FAILED'
      });
    }
  });

  // Check if product is in wishlist
  fastify.get('/check', {
    schema: {
      tags: ['Wishlist'],
      summary: 'Check if product is in wishlist',
      description: 'Check if a product is in the authenticated user\'s wishlist',
      querystring: CheckWishlistSchema,
      response: {
        200: {
          description: 'Wishlist check completed',
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                inWishlist: { type: 'boolean' },
                item: { 
                  type: 'object',
                  nullable: true
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    preHandler: [requireUser]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const { productId, variantId } = request.query as any;

      const wishlistItem = await wishlistService.isInWishlist(
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
      logger.error('Failed to check wishlist item', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (request.user as any)?.id,
        productId: (request.query as any)?.productId
      });

      return reply.status(500).send({
        message: 'Failed to check if product is in wishlist',
        error: 'WISHLIST_CHECK_FAILED'
      });
    }
  });

  // Clear wishlist
  fastify.delete('/', {
    schema: {
      tags: ['Wishlist'],
      summary: 'Clear wishlist',
      description: 'Remove all items from the authenticated user\'s wishlist',
      response: {
        200: {
          description: 'Wishlist cleared successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                removedCount: { type: 'number' }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    preHandler: requireUser
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      
      const removedCount = await wishlistService.clearWishlist(userId);

      return reply.status(200).send({
        message: 'Wishlist cleared successfully',
        data: {
          removedCount
        }
      });
    } catch (error) {
      logger.error('Failed to clear wishlist', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (request.user as any)?.id
      });

      return reply.status(500).send({
        message: 'Failed to clear wishlist',
        error: 'WISHLIST_CLEAR_FAILED'
      });
    }
  });

  // Get wishlist count
  fastify.get('/count', {
    schema: {
      tags: ['Wishlist'],
      summary: 'Get wishlist count',
      description: 'Get the number of items in the authenticated user\'s wishlist',
      response: {
        200: {
          description: 'Wishlist count retrieved',
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                count: { type: 'number' }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    preHandler: requireUser
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      
      const count = await wishlistService.countWishlistItems(userId);

      return reply.status(200).send({
        message: 'Wishlist count retrieved successfully',
        data: {
          count
        }
      });
    } catch (error) {
      logger.error('Failed to get wishlist count', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (request.user as any)?.id
      });

      return reply.status(500).send({
        message: 'Failed to get wishlist count',
        error: 'WISHLIST_COUNT_FAILED'
      });
    }
  });
} 