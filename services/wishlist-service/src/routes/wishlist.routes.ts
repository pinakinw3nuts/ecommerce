import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { WishlistController } from '../controllers/wishlist.controller';
import { authGuard } from '../middleware/authGuard';
import { validateRequest } from '../middleware/validateRequest';
import { uuidSchema, paginationSchema, metadataSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types/auth';

// Define request body types
interface AddToWishlistBody {
  productId: string;
  variantId?: string;
  productName?: string;
  productImage?: string;
  price?: number;
  metadata?: Record<string, any>;
}

interface WishlistItemParams {
  id: string;
}

interface WishlistQuery {
  page?: string;
  limit?: string;
  sortBy?: 'createdAt' | 'productName' | 'price';
  order?: 'ASC' | 'DESC';
}

// Validation schemas
const addToWishlistSchema = z.object({
  body: z.object({
    productId: uuidSchema,
    variantId: z.string().optional(),
    productName: z.string().optional(),
    productImage: z.string().optional(),
    price: z.number().optional(),
    metadata: metadataSchema
  })
});

const wishlistParamsSchema = z.object({
  params: z.object({
    id: uuidSchema
  })
});

const wishlistQuerySchema = z.object({
  query: paginationSchema.extend({
    sortBy: z.enum(['createdAt', 'productName', 'price']).optional(),
  })
});

const checkWishlistSchema = z.object({
  query: z.object({
    productId: uuidSchema,
    variantId: z.string().optional(),
  })
});

/**
 * Routes for wishlist operations
 */
export async function wishlistRoutes(fastify: FastifyInstance) {
  const controller = new WishlistController();

  // Apply authentication to all routes
  fastify.addHook('onRequest', authGuard);

  // Add product to wishlist
  fastify.post<{
    Body: AddToWishlistBody
  }>(
    '/',
    {
      schema: {
        tags: ['Wishlist'],
        summary: 'Add a product to the wishlist',
        description: 'Add a product to the authenticated user\'s wishlist',
        body: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string', format: 'uuid' },
            variantId: { type: 'string' },
            productName: { type: 'string' },
            productImage: { type: 'string' },
            price: { type: 'number' },
            metadata: { type: 'object', additionalProperties: true }
          }
        },
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
      preHandler: validateRequest(addToWishlistSchema)
    },
    (request, reply) => controller.addToWishlist(request as AuthenticatedRequest<{ Body: AddToWishlistBody }>, reply)
  );

  // Remove product from wishlist
  fastify.delete<{
    Params: WishlistItemParams
  }>(
    '/:id',
    {
      schema: {
        tags: ['Wishlist'],
        summary: 'Remove a product from the wishlist',
        description: 'Remove a product from the authenticated user\'s wishlist',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
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
      preHandler: validateRequest(wishlistParamsSchema)
    },
    (request, reply) => controller.removeFromWishlist(request as AuthenticatedRequest<{ Params: WishlistItemParams }>, reply)
  );

  // Get user's wishlist
  fastify.get<{
    Querystring: WishlistQuery
  }>(
    '/',
    {
      schema: {
        tags: ['Wishlist'],
        summary: 'Get user\'s wishlist',
        description: 'Get the authenticated user\'s wishlist with pagination',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            limit: { type: 'string' },
            sortBy: { type: 'string', enum: ['createdAt', 'productName', 'price'] },
            order: { type: 'string', enum: ['ASC', 'DESC'] }
          }
        },
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
      preHandler: validateRequest(wishlistQuerySchema)
    },
    (request, reply) => controller.getWishlist(request as AuthenticatedRequest<{ Querystring: WishlistQuery }>, reply)
  );

  // Check if product is in wishlist
  fastify.get<{
    Querystring: { productId: string, variantId?: string }
  }>(
    '/check',
    {
      schema: {
        tags: ['Wishlist'],
        summary: 'Check if product is in wishlist',
        description: 'Check if a product is in the authenticated user\'s wishlist',
        querystring: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string', format: 'uuid' },
            variantId: { type: 'string' }
          }
        },
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
      preHandler: validateRequest(checkWishlistSchema)
    },
    (request, reply) => controller.checkWishlistItem(
      request as AuthenticatedRequest<{ Querystring: { productId: string, variantId?: string } }>, 
      reply
    )
  );

  // Clear wishlist
  fastify.delete(
    '/',
    {
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
      }
    },
    (request, reply) => controller.clearWishlist(request as AuthenticatedRequest, reply)
  );

  // Get wishlist count
  fastify.get(
    '/count',
    {
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
      }
    },
    (request, reply) => controller.getWishlistCount(request as AuthenticatedRequest, reply)
  );
} 