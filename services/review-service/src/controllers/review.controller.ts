import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RouteGenericInterface } from 'fastify/types/route';
import { Review } from '../entities/Review';
import { apiLogger } from '../utils/logger';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';
import { ReviewService, ReviewSortOptions } from '../services/review.service';

// Define API Gateway URL
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

// Define authenticated request type with user property
type AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
};

// Define review schema for validation
const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  isVerifiedPurchase: z.boolean().optional(),
});

// Define update review schema for validation
const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

// Define query parameters schema
const reviewQuerySchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val)).optional(),
  limit: z.string().or(z.number()).transform(val => Number(val)).optional(),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).optional(),
  rating: z.string().or(z.number()).transform(val => Number(val)).optional(),
  verified: z.union([
    z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional()
  ]).optional(),
});

// Helper function to format review response
function formatReviewResponse(review: Review) {
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

/**
 * Review controller for managing product reviews
 */
export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  /**
   * Register public routes that don't require authentication
   */
  async registerPublicRoutes(fastify: FastifyInstance) {
    // GET /product/:productId - Get reviews for a product
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
      handler: this.getProductReviews.bind(this)
    });

    // GET /product-slug/:slug - Get reviews for a product by slug
    fastify.get('/product-slug/:slug', {
      schema: {
        tags: ['Reviews'],
        summary: 'Get reviews for a product by slug',
        description: 'Retrieve all published reviews for a specific product identified by its slug.',
        params: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string' }
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
          },
          404: {
            description: 'Product not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: this.getProductReviewsBySlug.bind(this)
    });

    // GET /detail/:id - Get a single review by ID
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
      handler: this.getReviewById.bind(this)
    });

    // GET /rating/:productId - Get product rating summary
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
      handler: this.getProductRating.bind(this)
    });
  }

  /**
   * Register protected routes that require authentication
   */
  async registerProtectedRoutes(fastify: FastifyInstance) {
    // POST / - Create a new review
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
      preHandler: [authGuard, validateRequest(reviewSchema)],
      handler: async (request, reply) => {
        const authRequest = request as unknown as AuthenticatedRequest<{
          Body: {
            productId: string;
            rating: number;
            comment?: string;
            isVerifiedPurchase?: boolean;
          }
        }>;
        return this.createReview(authRequest, reply);
      }
    });

    // PUT /:id - Update a review
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
      preHandler: [authGuard, validateRequest(updateReviewSchema)],
      handler: async (request, reply) => {
        const authRequest = request as unknown as AuthenticatedRequest<{
          Params: { id: string };
          Body: {
            rating?: number;
            comment?: string;
          }
        }>;
        return this.updateReview(authRequest, reply);
      }
    });

    // DELETE /:id - Delete a review
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
      preHandler: [authGuard],
      handler: async (request, reply) => {
        const authRequest = request as unknown as AuthenticatedRequest<{
          Params: { id: string };
        }>;
        return this.deleteReview(authRequest, reply);
      }
    });
  }

  /**
   * Create a new review
   */
  async createReview(request: AuthenticatedRequest<{
    Body: {
      productId: string;
      rating: number;
      comment?: string;
      isVerifiedPurchase?: boolean;
    }
  }>, reply: FastifyReply) {
    try {
      const { productId, rating, comment, isVerifiedPurchase = false } = request.body;
      const userId = request.user.id;

      // Create new review using service
      const savedReview = await this.reviewService.createReview({
        userId,
        productId,
        rating,
        comment,
        isVerifiedPurchase
      });
      
      apiLogger.info({ reviewId: savedReview.id, userId, productId }, 'Review created');
      
      return reply.code(201).send(formatReviewResponse(savedReview));
    } catch (error) {
      apiLogger.error(error, 'Error creating review');
      return reply.code(500).send({ message: 'Error creating review' });
    }
  }

  /**
   * Update an existing review
   */
  async updateReview(request: AuthenticatedRequest<{
    Params: { id: string };
    Body: {
      rating?: number;
      comment?: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { rating, comment } = request.body;
      const userId = request.user.id;

      // Update review using service
      const updatedReview = await this.reviewService.updateReview(id, userId, {
        rating,
        comment
      });

      if (!updatedReview) {
        return reply.code(404).send({ message: 'Review not found' });
      }

      apiLogger.info({ reviewId: id, userId }, 'Review updated');
      
      return reply.send(formatReviewResponse(updatedReview));
    } catch (error) {
      apiLogger.error(error, 'Error updating review');
      return reply.code(500).send({ message: 'Error updating review' });
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(request: AuthenticatedRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Delete review using service
      const success = await this.reviewService.deleteReview(id, userId);

      if (!success) {
        return reply.code(404).send({ message: 'Review not found' });
      }

      apiLogger.info({ reviewId: id, userId }, 'Review deleted');
      
      return reply.code(204).send();
    } catch (error) {
      apiLogger.error(error, 'Error deleting review');
      return reply.code(500).send({ message: 'Error deleting review' });
    }
  }

  /**
   * Get reviews for a product
   */
  async getProductReviews(request: FastifyRequest<{
    Params: { productId: string };
    Querystring: {
      page?: number;
      limit?: number;
      sort?: string;
      rating?: number;
      verified?: boolean;
    }
  }>, reply: FastifyReply) {
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
      const sortOptions = this.getSortOptions(sort);

      // Get reviews using service
      const { reviews, total } = await this.reviewService.getProductReviews(
        productId,
        {
          pagination: { page, limit },
          sort: sortOptions,
          rating,
          verified
        }
      );

      // Get product rating
      const productRating = await this.reviewService.getProductRating(productId);

      apiLogger.info({ productId, page, limit }, 'Retrieved product reviews');

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
      apiLogger.error(error, 'Error getting product reviews');
      return reply.code(500).send({ message: 'Error getting product reviews' });
    }
  }
  
  /**
   * Get reviews for a product by slug
   */
  async getProductReviewsBySlug(request: FastifyRequest<{
    Params: { slug: string };
    Querystring: {
      page?: number;
      limit?: number;
      sort?: string;
      rating?: number;
      verified?: boolean;
    }
  }>, reply: FastifyReply) {
    try {
      const { slug } = request.params;
      const { 
        page = 1, 
        limit = 20, 
        sort = 'newest',
        rating,
        verified 
      } = request.query;

      // Convert sort string to ReviewSortOptions
      const sortOptions = this.getSortOptions(sort);

      try {
        // Get reviews by slug using service
        const { reviews, total, productId } = await this.reviewService.getProductReviewsBySlug(
          slug,
          {
            pagination: { page, limit },
            sort: sortOptions,
            rating,
            verified
          }
        );

        // Get product rating
        const productRating = await this.reviewService.getProductRating(productId);

        apiLogger.info({ slug, productId, page, limit }, 'Retrieved product reviews by slug');

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
        apiLogger.error(error, 'Error getting product by slug');
        return reply.code(404).send({ message: 'Product not found' });
      }
    } catch (error) {
      apiLogger.error(error, 'Error getting product reviews by slug');
      return reply.code(500).send({ message: 'Error getting product reviews' });
    }
  }
  
  /**
   * Get a single review by ID
   */
  async getReviewById(request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      
      // Get review by ID using service
      const review = await this.reviewService.getReviewById(id);
      
      if (!review) {
        return reply.code(404).send({ message: 'Review not found' });
      }
      
      apiLogger.info({ reviewId: id }, 'Retrieved review by ID');
      
      return reply.send(formatReviewResponse(review));
    } catch (error) {
      apiLogger.error(error, 'Error getting review by ID');
      return reply.code(500).send({ message: 'Error getting review' });
    }
  }
  
  /**
   * Get product rating summary
   */
  async getProductRating(request: FastifyRequest<{
    Params: { productId: string };
  }>, reply: FastifyReply) {
    try {
      const { productId } = request.params;
      
      // Get product rating using service
      const productRating = await this.reviewService.getProductRating(productId);
      
      apiLogger.info({ productId }, 'Retrieved product rating');
      
      return reply.send(productRating);
    } catch (error) {
      apiLogger.error(error, 'Error getting product rating');
      return reply.code(500).send({ message: 'Error getting product rating' });
    }
  }

  /**
   * Helper method to convert sort string to ReviewSortOptions
   */
  private getSortOptions(sort: string): ReviewSortOptions {
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
} 