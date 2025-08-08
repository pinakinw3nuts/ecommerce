import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ReviewService, ReviewSortOptions } from '../services/review.service';
import { requireUser, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

// Define review schema for validation
const createReviewSchema = {
  type: 'object',
  required: ['productId', 'rating'],
  properties: {
    productId: { type: 'string', format: 'uuid' },
    rating: { type: 'number', minimum: 1, maximum: 5 },
    comment: { type: 'string', maxLength: 1000 },
    isVerifiedPurchase: { type: 'boolean' }
  }
};

const updateReviewSchema = {
  type: 'object',
  properties: {
    rating: { type: 'number', minimum: 1, maximum: 5 },
    comment: { type: 'string', maxLength: 1000 }
  }
};

const reviewQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'string', default: '1' },
    limit: { type: 'string', default: '20' },
    sort: { 
      type: 'string', 
      enum: ['newest', 'oldest', 'highest', 'lowest'],
      default: 'newest'
    },
    rating: { type: 'string' },
    verified: { type: 'string' }
  }
};

// Helper function to format review response
function formatReviewResponse(review: any) {
  return {
    id: review.id,
    userId: review.userId,
    productId: review.productId,
    rating: review.rating,
    comment: review.comment,
    isPublished: review.isPublished,
    isVerifiedPurchase: review.isVerifiedPurchase,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt
  };
}

// Helper function to convert sort string to ReviewSortOptions
function getSortOptions(sort: string): ReviewSortOptions {
  switch (sort) {
    case 'highest':
      return { sortBy: 'rating', sortOrder: 'DESC' };
    case 'lowest':
      return { sortBy: 'rating', sortOrder: 'ASC' };
    case 'oldest':
      return { sortBy: 'createdAt', sortOrder: 'ASC' };
    case 'newest':
    default:
      return { sortBy: 'createdAt', sortOrder: 'DESC' };
  }
}

export async function reviewRoutes(fastify: FastifyInstance) {
  const reviewService = new ReviewService();

  // GET /product/:productId - Get reviews for a product (public)
  fastify.get('/product/:productId', {
    schema: {
      tags: ['Reviews'],
      summary: 'Get reviews for a product',
      description: 'Retrieve all published reviews for a specific product with pagination and filtering options.',
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', format: 'uuid' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          sort: { 
            type: 'string', 
            enum: ['newest', 'oldest', 'highest', 'lowest'],
            default: 'newest'
          },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          verified: { type: 'boolean' }
        }
      },
      response: {
        200: {
          description: 'List of reviews',
          type: 'object',
          properties: {
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  userId: { type: 'string', format: 'uuid' },
                  productId: { type: 'string', format: 'uuid' },
                  rating: { type: 'integer' },
                  comment: { type: 'string' },
                  isVerifiedPurchase: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            },
            productRating: {
              type: 'object',
              properties: {
                averageRating: { type: 'number' },
                totalReviews: { type: 'integer' },
                ratingDistribution: {
                  type: 'object',
                  additionalProperties: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{
      Params: { productId: string };
      Querystring: {
        page?: number;
        limit?: number;
        sort?: string;
        rating?: number;
        verified?: boolean;
      }
    }>, reply: FastifyReply) => {
      try {
        const { productId } = request.params;
        const { 
          page = 1, 
          limit = 20, 
          sort = 'newest',
          rating,
          verified 
        } = request.query;

        // Convert sort string to ReviewSortOptions
        const sortOptions = getSortOptions(sort);

        // Get reviews using service
        const { reviews, total } = await reviewService.getProductReviews(
          productId,
          {
            pagination: { page, limit },
            sort: sortOptions,
            rating,
            verified
          }
        );

        // Get product rating
        const productRating = await reviewService.getProductRating(productId);

        logger.info({ productId, page, limit }, 'Retrieved product reviews');

        return reply.send({
          reviews: reviews.map(formatReviewResponse),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          productRating: {
            averageRating: productRating.averageRating,
            totalReviews: productRating.reviewCount,
            ratingDistribution: productRating.ratingDistribution
          }
        });
      } catch (error) {
        logger.error(error, 'Error getting product reviews');
        return reply.code(500).send({ message: 'Error getting product reviews' });
      }
    }
  });

  // GET /detail/:id - Get a single review by ID (public)
  fastify.get('/detail/:id', {
    schema: {
      tags: ['Reviews'],
      summary: 'Get a single review by ID',
      description: 'Retrieve a specific review by its ID.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          description: 'Review details',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer' },
            comment: { type: 'string' },
            isPublished: { type: 'boolean' },
            isVerifiedPurchase: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        404: {
          description: 'Review not found',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{
      Params: { id: string };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // Get review by ID using service
        const review = await reviewService.getReviewById(id);
        
        if (!review) {
          return reply.code(404).send({ message: 'Review not found' });
        }
        
        logger.info({ reviewId: id }, 'Retrieved review by ID');
        
        return reply.send(formatReviewResponse(review));
      } catch (error) {
        logger.error(error, 'Error getting review by ID');
        return reply.code(500).send({ message: 'Error getting review' });
      }
    }
  });

  // GET /rating/:productId - Get product rating summary (public)
  fastify.get('/rating/:productId', {
    schema: {
      tags: ['Reviews'],
      summary: 'Get product rating summary',
      description: 'Retrieve the aggregated rating statistics for a product.',
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          description: 'Product rating summary',
          type: 'object',
          properties: {
            productId: { type: 'string', format: 'uuid' },
            averageRating: { type: 'number' },
            reviewCount: { type: 'integer' },
            ratingDistribution: {
              type: 'object',
              additionalProperties: { type: 'integer' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{
      Params: { productId: string };
    }>, reply: FastifyReply) => {
      try {
        const { productId } = request.params;
        
        // Get product rating using service
        const productRating = await reviewService.getProductRating(productId);
        
        logger.info({ productId }, 'Retrieved product rating');
        
        return reply.send(productRating);
      } catch (error) {
        logger.error(error, 'Error getting product rating');
        return reply.code(500).send({ message: 'Error getting product rating' });
      }
    }
  });

  // POST / - Create a new review (authenticated)
  fastify.post('/', {
    schema: {
      tags: ['Reviews'],
      summary: 'Create a new review',
      description: 'Create a new review for a product. Requires authentication.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['productId', 'rating'],
        properties: {
          productId: { type: 'string', format: 'uuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', maxLength: 1000 },
          isVerifiedPurchase: { type: 'boolean', default: false }
        }
      },
      response: {
        201: {
          description: 'Review created successfully',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer' },
            comment: { type: 'string' },
            isPublished: { type: 'boolean' },
            isVerifiedPurchase: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [requireUser],
    handler: async (request: FastifyRequest<{
      Body: {
        productId: string;
        rating: number;
        comment?: string;
        isVerifiedPurchase?: boolean;
      }
    }>, reply: FastifyReply) => {
      try {
        const { productId, rating, comment, isVerifiedPurchase = false } = request.body;
        const userId = (request.user as any).id;

        // Create new review using service
        const savedReview = await reviewService.createReview({
          userId,
          productId,
          rating,
          comment,
          isVerifiedPurchase
        });
        
        logger.info({ reviewId: savedReview.id, userId, productId }, 'Review created');
        
        return reply.code(201).send(formatReviewResponse(savedReview));
      } catch (error) {
        logger.error(error, 'Error creating review');
        return reply.code(500).send({ message: 'Error creating review' });
      }
    }
  });

  // PUT /:id - Update a review (authenticated)
  fastify.put<{
    Params: { id: string };
    Body: {
      rating?: number;
      comment?: string;
    }
  }>('/:id', {
    schema: {
      tags: ['Reviews'],
      summary: 'Update a review',
      description: 'Update an existing review. User can only update their own reviews.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: {
          description: 'Review updated successfully',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer' },
            comment: { type: 'string' },
            isPublished: { type: 'boolean' },
            isVerifiedPurchase: { type: 'boolean' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Review not found',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [requireUser],
    handler: async (request: FastifyRequest<{
      Params: { id: string };
      Body: {
        rating?: number;
        comment?: string;
      }
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { rating, comment } = request.body;
        const userId = (request.user as any).id;

        // Update review using service
        const updatedReview = await reviewService.updateReview(id, userId, {
          rating,
          comment
        });

        if (!updatedReview) {
          return reply.code(404).send({ message: 'Review not found' });
        }

        logger.info({ reviewId: id, userId }, 'Review updated');
        
        return reply.send(formatReviewResponse(updatedReview));
      } catch (error) {
        logger.error(error, 'Error updating review');
        return reply.code(500).send({ message: 'Error updating review' });
      }
    }
  });

  // DELETE /:id - Delete a review (authenticated)
  fastify.delete<{
    Params: { id: string };
  }>('/:id', {
    schema: {
      tags: ['Reviews'],
      summary: 'Delete a review',
      description: 'Delete an existing review. User can only delete their own reviews.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        204: {
          description: 'Review deleted successfully',
          type: 'null'
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Review not found',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [requireUser],
    handler: async (request: FastifyRequest<{
      Params: { id: string };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const userId = (request.user as any).id;

        // Delete review using service
        const success = await reviewService.deleteReview(id, userId);

        if (!success) {
          return reply.code(404).send({ message: 'Review not found' });
        }

        logger.info({ reviewId: id, userId }, 'Review deleted');
        
        return reply.code(204).send();
      } catch (error) {
        logger.error(error, 'Error deleting review');
        return reply.code(500).send({ message: 'Error deleting review' });
      }
    }
  });

  // Admin routes
  // PUT /admin/:id/moderate - Moderate a review (admin only)
  fastify.put<{
    Params: { id: string };
    Body: { isPublished: boolean };
  }>('/admin/:id/moderate', {
    schema: {
      tags: ['Reviews - Admin'],
      summary: 'Moderate a review',
      description: 'Publish or unpublish a review. Admin only.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['isPublished'],
        properties: {
          isPublished: { type: 'boolean' }
        }
      },
      response: {
        200: {
          description: 'Review moderated successfully',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            isPublished: { type: 'boolean' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Review not found',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest<{
      Params: { id: string };
      Body: { isPublished: boolean };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { isPublished } = request.body;

        // Moderate review using service
        const moderatedReview = await reviewService.moderateReview(id, isPublished);

        logger.info({ reviewId: id, isPublished }, 'Review moderated by admin');
        
        return reply.send({
          id: moderatedReview.id,
          isPublished: moderatedReview.isPublished,
          updatedAt: moderatedReview.updatedAt
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({ message: 'Review not found' });
        }
        logger.error(error, 'Error moderating review');
        return reply.code(500).send({ message: 'Error moderating review' });
      }
    }
  });

  // GET /admin/list - List all reviews with filters (admin only)
  fastify.get('/admin/list', {
    schema: {
      tags: ['Reviews - Admin'],
      summary: 'List all reviews with filters',
      description: 'Get all reviews with filtering, sorting, and pagination. Admin only.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          productId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          isPublished: { type: 'boolean' },
          isVerifiedPurchase: { type: 'boolean' },
          sort: { 
            type: 'string', 
            enum: ['newest', 'oldest', 'highest', 'lowest'],
            default: 'newest'
          }
        }
      },
      response: {
        200: {
          description: 'List of reviews',
          type: 'object',
          properties: {
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  userId: { type: 'string', format: 'uuid' },
                  productId: { type: 'string', format: 'uuid' },
                  rating: { type: 'integer' },
                  comment: { type: 'string' },
                  isPublished: { type: 'boolean' },
                  isVerifiedPurchase: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest<{
      Querystring: {
        page?: number;
        limit?: number;
        productId?: string;
        userId?: string;
        rating?: number;
        isPublished?: boolean;
        isVerifiedPurchase?: boolean;
        sort?: string;
      }
    }>, reply: FastifyReply) => {
      try {
        const { 
          page = 1, 
          limit = 20,
          productId,
          userId,
          rating,
          isPublished,
          isVerifiedPurchase,
          sort = 'newest'
        } = request.query;

        // Convert sort string to ReviewSortOptions
        const sortOptions = getSortOptions(sort);

        // Set up filters
        const filters: any = {};
        if (productId) filters.productId = productId;
        if (userId) filters.userId = userId;
        if (rating) filters.rating = rating;
        if (isPublished !== undefined) filters.isPublished = isPublished;
        if (isVerifiedPurchase !== undefined) filters.isVerifiedPurchase = isVerifiedPurchase;

        // Get reviews using service
        const { reviews, total } = await reviewService.listReviews({
          filters,
          sort: sortOptions,
          pagination: { page, limit }
        });

        logger.info({ page, limit, total }, 'Admin listed reviews');

        return reply.send({
          reviews: reviews.map(formatReviewResponse),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        logger.error(error, 'Error listing reviews');
        return reply.code(500).send({ message: 'Error listing reviews' });
      }
    }
  });
} 