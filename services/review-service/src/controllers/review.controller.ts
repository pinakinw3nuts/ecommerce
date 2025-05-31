import { FastifyRequest, FastifyReply } from 'fastify';
import { RouteGenericInterface } from 'fastify/types/route';
import { getRepository } from '../config/database';
import { Review } from '../entities/Review';
import { ProductRating } from '../entities/ProductRating';
import { calculateAverageRating } from '../utils/average';
import { apiLogger } from '../utils/logger';

// Define authenticated request type with user property
type AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
};

/**
 * Controller for review-related operations
 */
export class ReviewController {
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

      // Create new review
      const review = new Review();
      review.userId = userId;
      review.productId = productId;
      review.rating = rating;
      review.comment = comment;
      review.isVerifiedPurchase = isVerifiedPurchase;
      review.isPublished = true;

      // Save review
      const savedReview = await getRepository(Review).save(review);
      
      // Update product rating
      await this.updateProductRating(productId);

      apiLogger.info({ reviewId: savedReview.id, userId, productId }, 'Review created');
      
      return reply.code(201).send(savedReview);
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

      // Find review to ensure it exists and belongs to the user
      const review = await getRepository(Review).findOne({
        where: { id, userId }
      });

      if (!review) {
        return reply.code(404).send({ message: 'Review not found' });
      }

      // Update review
      const updateResult = await getRepository(Review).update(
        { id },
        { 
          rating: rating !== undefined ? rating : review.rating,
          comment: comment !== undefined ? comment : review.comment,
          updatedAt: new Date()
        }
      );

      if (updateResult.affected === 0) {
        return reply.code(404).send({ message: 'Review not found' });
      }

      // If rating changed, update product rating
      if (rating !== undefined && rating !== review.rating) {
        await this.updateProductRating(review.productId);
      }

      // Get updated review
      const updatedReview = await getRepository(Review).findOne({
        where: { id }
      });

      apiLogger.info({ reviewId: id, userId }, 'Review updated');
      
      return reply.send(updatedReview);
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

      // Find review to ensure it exists and belongs to the user
      const review = await getRepository(Review).findOne({
        where: { id, userId }
      });

      if (!review) {
        return reply.code(404).send({ message: 'Review not found' });
      }

      // Delete review
      await getRepository(Review).delete({ id });

      // Update product rating
      await this.updateProductRating(review.productId);

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

      // Calculate offset
      const offset = (page - 1) * limit;

      // Create query builder
      const queryBuilder = getRepository(Review)
        .createQueryBuilder('review')
        .where('review.productId = :productId', { productId })
        .andWhere('review.isPublished = :isPublished', { isPublished: true });

      // Add filters
      if (rating) {
        queryBuilder.andWhere('review.rating = :rating', { rating });
      }

      if (verified !== undefined) {
        queryBuilder.andWhere('review.isVerifiedPurchase = :verified', { verified });
      }

      // Add sorting
      switch (sort) {
        case 'highest':
          queryBuilder.orderBy('review.rating', 'DESC');
          break;
        case 'lowest':
          queryBuilder.orderBy('review.rating', 'ASC');
          break;
        case 'oldest':
          queryBuilder.orderBy('review.createdAt', 'ASC');
          break;
        case 'newest':
        default:
          queryBuilder.orderBy('review.createdAt', 'DESC');
          break;
      }

      // Add pagination
      queryBuilder.skip(offset).take(limit);

      // Get reviews and count
      const [reviews, total] = await queryBuilder.getManyAndCount();

      // Get product rating
      const productRating = await getRepository(ProductRating).findOne({
        where: { productId }
      });

      // Calculate total pages
      const pages = Math.ceil(total / limit);

      apiLogger.info({ productId, page, limit, total }, 'Retrieved product reviews');
      
      return reply.send({
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages
        },
        productRating: productRating || {
          productId,
          averageRating: 0,
          reviewCount: 0,
          ratingDistribution: {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
          }
        }
      });
    } catch (error) {
      apiLogger.error(error, 'Error retrieving product reviews');
      return reply.code(500).send({ message: 'Error retrieving product reviews' });
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

      // Find review
      const review = await getRepository(Review).findOne({
        where: { id }
      });

      if (!review) {
        return reply.code(404).send({ message: 'Review not found' });
      }

      // Check if review is published or if the user is the author
      if (!review.isPublished && (!request.user || !request.user || typeof request.user === 'string' || !('id' in request.user) || request.user.id !== review.userId)) {
        return reply.code(404).send({ message: 'Review not found' });
      }

      apiLogger.info({ reviewId: id }, 'Retrieved review');
      
      return reply.send(review);
    } catch (error) {
      apiLogger.error(error, 'Error retrieving review');
      return reply.code(500).send({ message: 'Error retrieving review' });
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

      // Get product rating
      const productRating = await getRepository(ProductRating).findOne({
        where: { productId }
      });

      if (!productRating) {
        return reply.send({
          productId,
          averageRating: 0,
          reviewCount: 0,
          ratingDistribution: {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
          }
        });
      }

      apiLogger.info({ productId }, 'Retrieved product rating');
      
      return reply.send(productRating);
    } catch (error) {
      apiLogger.error(error, 'Error retrieving product rating');
      return reply.code(500).send({ message: 'Error retrieving product rating' });
    }
  }

  /**
   * Update product rating
   * @private
   */
  private async updateProductRating(productId: string): Promise<void> {
    try {
      // Get all published reviews for the product
      const reviews = await getRepository(Review).find({
        where: { 
          productId,
          isPublished: true
        }
      });

      // If no reviews, delete product rating if it exists
      if (reviews.length === 0) {
        await getRepository(ProductRating).delete({ productId });
        return;
      }

      // Calculate ratings
      const ratings = reviews.map(review => review.rating);
      const averageRating = calculateAverageRating(ratings);
      
      // Calculate rating distribution
      const ratingDistribution: { [key: string]: number } = {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0
      };

      reviews.forEach(review => {
        const ratingKey = review.rating.toString();
        if (ratingKey in ratingDistribution) {
          ratingDistribution[ratingKey]++;
        }
      });

      // Update or create product rating
      const productRating = await getRepository(ProductRating).findOne({
        where: { productId }
      });

      if (productRating) {
        await getRepository(ProductRating).update(
          { productId },
          {
            averageRating,
            reviewCount: reviews.length,
            ratingDistribution
          }
        );
      } else {
        const newProductRating = new ProductRating();
        newProductRating.productId = productId;
        newProductRating.averageRating = averageRating;
        newProductRating.reviewCount = reviews.length;
        newProductRating.ratingDistribution = ratingDistribution;
        await getRepository(ProductRating).save(newProductRating);
      }

      apiLogger.info({ productId, averageRating, reviewCount: reviews.length }, 'Product rating updated');
    } catch (error) {
      apiLogger.error(error, 'Error updating product rating');
      throw error;
    }
  }
} 