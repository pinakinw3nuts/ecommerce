import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ReviewController } from '../controllers/review.controller';
import { ModerationController } from '../controllers/moderation.controller';
import { authGuard, JwtPayload } from '../middleware/authGuard';
import { apiLogger } from '../utils/logger';
import { RouteGenericInterface } from 'fastify/types/route';

// Define authenticated request type with user property
type AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
};

/**
 * Review routes plugin
 * Registers all review-related routes
 */
export async function reviewRoutes(fastify: FastifyInstance) {
  const reviewController = new ReviewController();

  // Log route registration
  apiLogger.info('Registering review routes');

  // Create a new review
  fastify.post<{
    Body: {
      productId: string;
      rating: number;
      comment?: string;
      isVerifiedPurchase?: boolean;
    }
  }>('/reviews', {
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
    preHandler: [authGuard],
    handler: async (request, reply) => {
      const authRequest = request as unknown as AuthenticatedRequest<{
        Body: {
          productId: string;
          rating: number;
          comment?: string;
          isVerifiedPurchase?: boolean;
        }
      }>;
      return reviewController.createReview(authRequest, reply);
    }
  });

  fastify.get('/reviews/product/:productId', {
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
    handler: reviewController.getProductReviews.bind(reviewController)
  });

  fastify.get('/reviews/detail/:id', {
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
    handler: reviewController.getReviewById.bind(reviewController)
  });

  fastify.get('/reviews/rating/:productId', {
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
            totalReviews: { type: 'integer' },
            ratingDistribution: {
              type: 'object',
              additionalProperties: { type: 'integer' }
            }
          }
        }
      }
    },
    handler: reviewController.getProductRating.bind(reviewController)
  });

  fastify.put<{
    Params: { id: string };
    Body: {
      rating?: number;
      comment?: string;
    }
  }>('/reviews/:id', {
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
    preHandler: [authGuard],
    handler: async (request, reply) => {
      const authRequest = request as unknown as AuthenticatedRequest<{
        Params: { id: string };
        Body: {
          rating?: number;
          comment?: string;
        }
      }>;
      return reviewController.updateReview(authRequest, reply);
    }
  });

  fastify.delete<{
    Params: { id: string };
  }>('/reviews/:id', {
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
      return reviewController.deleteReview(authRequest, reply);
    }
  });
} 