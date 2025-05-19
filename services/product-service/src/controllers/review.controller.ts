import { FastifyInstance, FastifyRequest, FastifyReply, RouteGenericInterface, RouteShorthandOptions } from 'fastify';
import { ReviewService } from '../services/review.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';

const reviewService = new ReviewService();

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
  images: z.array(z.string()).optional(),
  isVerifiedPurchase: z.boolean().optional()
});

interface ReviewParams {
  productId: string;
  reviewId?: string;
}

// Declare module augmentation for Fastify
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      name: string;
    };
  }
}

interface AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> extends FastifyRequest<T> {
  user: {
    id: string;
    name: string;
  };
}

// Shared schema for ProductReview
const productReviewSchema = {
  type: 'object',
  required: ['id', 'userId', 'userName', 'rating', 'comment'],
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    userName: { type: 'string' },
    rating: { type: 'number' },
    comment: { type: 'string' },
    images: { 
      type: 'array',
      items: { type: 'string' }
    },
    isVerifiedPurchase: { type: 'boolean', default: false },
    helpfulCount: { type: 'number', default: 0 },
    isPublished: { type: 'boolean', default: true },
    metadata: {
      type: 'object',
      properties: {
        platform: { type: 'string' },
        deviceType: { type: 'string' },
        purchaseDate: { type: 'string' }
      }
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const reviewController = {
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    fastify.get('/:productId', {
      schema: {
        tags: ['reviews'],
        summary: 'List product reviews',
        params: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string', description: 'Product ID' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            skip: { type: 'number' },
            take: { type: 'number' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: productReviewSchema
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: ReviewParams, Querystring: { skip?: number; take?: number } }>, reply) => {
        const reviews = await reviewService.listProductReviews(request.params.productId, {
          skip: request.query.skip,
          take: request.query.take
        });
        return reply.send(reviews);
      }
    });

    fastify.get('/:reviewId/details', {
      schema: {
        tags: ['reviews'],
        summary: 'Get a review by ID',
        params: {
          type: 'object',
          required: ['reviewId'],
          properties: {
            reviewId: { type: 'string', description: 'Review ID' }
          }
        },
        response: {
          200: productReviewSchema,
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { reviewId: string } }>, reply) => {
        const review = await reviewService.getReviewById(request.params.reviewId);
        if (!review) {
          return reply.code(404).send({ message: 'Review not found' });
        }
        return reply.send(review);
      }
    });

    fastify.post('/:reviewId/helpful', {
      schema: {
        tags: ['reviews'],
        summary: 'Mark a review as helpful',
        params: {
          type: 'object',
          required: ['reviewId'],
          properties: {
            reviewId: { type: 'string', description: 'Review ID' }
          }
        },
        response: {
          200: productReviewSchema,
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { reviewId: string } }>, reply) => {
        try {
          const review = await reviewService.markReviewHelpful(request.params.reviewId);
          return reply.send(review);
        } catch (error) {
          return reply.code(404).send({ message: 'Review not found' });
        }
      }
    });
  },

  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    const createReviewOpts: RouteShorthandOptions = {
      schema: {
        tags: ['reviews'],
        summary: 'Create a new review',
        params: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['rating', 'comment'],
          properties: {
            rating: { type: 'number', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            isVerifiedPurchase: { type: 'boolean' }
          }
        },
        response: {
          201: productReviewSchema
        }
      },
      preHandler: validateRequest(reviewSchema)
    };

    fastify.post<{
      Params: ReviewParams;
      Body: z.infer<typeof reviewSchema>;
    }>('/:productId', createReviewOpts, async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      const review = await reviewService.createReview(request.params.productId, {
        ...request.body,
        userId: request.user.id,
        userName: request.user.name
      });
      return reply.code(201).send(review);
    });

    fastify.put('/:reviewId', {
      schema: {
        tags: ['reviews'],
        summary: 'Update a review',
        params: {
          type: 'object',
          required: ['reviewId'],
          properties: {
            reviewId: { type: 'string', description: 'Review ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            rating: { type: 'number', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            isPublished: { type: 'boolean' }
          }
        },
        response: {
          200: productReviewSchema,
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: validateRequest(reviewSchema.partial()),
      handler: async (request: FastifyRequest<{ Params: { reviewId: string }; Body: Partial<z.infer<typeof reviewSchema>> }>, reply) => {
        const review = await reviewService.updateReview(request.params.reviewId, request.body);
        if (!review) {
          return reply.code(404).send({ message: 'Review not found' });
        }
        return reply.send(review);
      }
    });

    fastify.delete('/:reviewId', {
      schema: {
        tags: ['reviews'],
        summary: 'Delete a review',
        params: {
          type: 'object',
          required: ['reviewId'],
          properties: {
            reviewId: { type: 'string', description: 'Review ID' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Review deleted successfully'
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { reviewId: string } }>, reply) => {
        try {
          await reviewService.deleteReview(request.params.reviewId);
          return reply.code(204).send();
        } catch (error) {
          return reply.code(404).send({ message: 'Review not found' });
        }
      }
    });
  }
}; 