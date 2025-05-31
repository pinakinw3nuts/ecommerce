import { FastifyRequest, FastifyReply } from 'fastify';
import { RouteGenericInterface } from 'fastify/types/route';
import { getRepository } from '../config/database';
import { Review } from '../entities/Review';
import { moderationLogger } from '../utils/logger';

// Define authenticated request type with user property
type AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
};

/**
 * Controller for moderation-related operations
 */
export class ModerationController {
  /**
   * Hide a review (unpublish)
   */
  async hideReview(request: AuthenticatedRequest<{
    Params: { id: string };
    Body: {
      reason: 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'FAKE_REVIEW' | 'POLICY_VIOLATION' | 'USER_REQUESTED' | 'OTHER';
      comment?: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { reason, comment } = request.body;
      const adminId = request.user.id;

      // Find review
      const review = await getRepository(Review).findOne({
        where: { id }
      });

      if (!review) {
        return reply.code(404).send({ message: 'Review not found' });
      }

      // Update review with new metadata
      review.isPublished = false;
      review.metadata = {
        ...review.metadata,
        moderation: {
          action: 'HIDDEN',
          timestamp: new Date(),
          reason,
          comment,
          adminId
        }
      };

      // Save the updated review
      await getRepository(Review).save(review);

      moderationLogger.info({ 
        reviewId: id, 
        adminId, 
        action: 'HIDDEN',
        reason
      }, 'Review hidden');
      
      return reply.send(review);
    } catch (error) {
      moderationLogger.error(error, 'Error hiding review');
      return reply.code(500).send({ message: 'Error hiding review' });
    }
  }

  /**
   * Publish a review (restore)
   */
  async publishReview(request: AuthenticatedRequest<{
    Params: { id: string };
    Body: {
      reason: 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'FAKE_REVIEW' | 'POLICY_VIOLATION' | 'USER_REQUESTED' | 'OTHER';
      comment?: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { reason, comment } = request.body;
      const adminId = request.user.id;

      // Find review
      const review = await getRepository(Review).findOne({
        where: { id }
      });

      if (!review) {
        return reply.code(404).send({ message: 'Review not found' });
      }

      // Update review with new metadata
      review.isPublished = true;
      review.metadata = {
        ...review.metadata,
        moderation: {
          action: 'PUBLISHED',
          timestamp: new Date(),
          reason,
          comment,
          adminId
        }
      };

      // Save the updated review
      await getRepository(Review).save(review);

      moderationLogger.info({ 
        reviewId: id, 
        adminId, 
        action: 'PUBLISHED',
        reason
      }, 'Review published');
      
      return reply.send(review);
    } catch (error) {
      moderationLogger.error(error, 'Error publishing review');
      return reply.code(500).send({ message: 'Error publishing review' });
    }
  }

  /**
   * Delete a review (admin)
   */
  async deleteReview(request: AuthenticatedRequest<{
    Params: { id: string };
    Body: {
      reason: 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'FAKE_REVIEW' | 'POLICY_VIOLATION' | 'USER_REQUESTED' | 'OTHER';
      comment?: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { reason, comment } = request.body;
      const adminId = request.user.id;

      // Find review
      const review = await getRepository(Review).findOne({
        where: { id }
      });

      if (!review) {
        return reply.code(404).send({ message: 'Review not found' });
      }

      // Log deletion
      moderationLogger.info({ 
        reviewId: id, 
        adminId, 
        action: 'DELETED',
        reason,
        comment,
        reviewData: {
          userId: review.userId,
          productId: review.productId,
          rating: review.rating,
          createdAt: review.createdAt
        }
      }, 'Review deleted by admin');

      // Delete review
      await getRepository(Review).delete({ id });
      
      return reply.code(204).send();
    } catch (error) {
      moderationLogger.error(error, 'Error deleting review');
      return reply.code(500).send({ message: 'Error deleting review' });
    }
  }

  /**
   * Get flagged reviews
   */
  async getFlaggedReviews(request: AuthenticatedRequest<{
    Querystring: {
      page: number;
      limit: number;
    };
  }>, reply: FastifyReply) {
    try {
      const { page = 1, limit = 20 } = request.query;
      
      // Calculate offset
      const offset = (page - 1) * limit;

      // Get reviews with reports
      const queryBuilder = getRepository(Review)
        .createQueryBuilder('review')
        .where("review.metadata->>'reports' IS NOT NULL");

      // Add pagination
      queryBuilder.skip(offset).take(limit);

      // Get reviews and count
      const [reviews, total] = await queryBuilder.getManyAndCount();

      // Calculate total pages
      const pages = Math.ceil(total / limit);

      moderationLogger.info({ page, limit, total }, 'Retrieved flagged reviews');
      
      return reply.send({
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      });
    } catch (error) {
      moderationLogger.error(error, 'Error retrieving flagged reviews');
      return reply.code(500).send({ message: 'Error retrieving flagged reviews' });
    }
  }
} 