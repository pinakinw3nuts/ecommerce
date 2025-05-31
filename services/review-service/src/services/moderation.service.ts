import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Review } from '../entities';
import { ReviewService } from './review.service';
import { authLogger } from '../utils/logger';

/**
 * Reason for moderation action
 */
export enum ModerationReason {
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  SPAM = 'SPAM',
  FAKE_REVIEW = 'FAKE_REVIEW',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  USER_REQUESTED = 'USER_REQUESTED',
  OTHER = 'OTHER'
}

/**
 * DTO for moderation actions
 */
export interface ModerationActionDto {
  reason: ModerationReason;
  comment?: string;
  adminId: string;
}

/**
 * Service for review moderation operations (admin only)
 */
export class ModerationService {
  private reviewRepository: Repository<Review>;
  private reviewService: ReviewService;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.reviewService = new ReviewService();
  }

  /**
   * Hide a review (set isPublished to false)
   */
  async hideReview(reviewId: string, dto: ModerationActionDto): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
      
      if (!review) {
        throw new Error('Review not found');
      }

      // Set review as unpublished
      review.isPublished = false;
      
      // Add moderation metadata
      review.metadata = {
        ...review.metadata,
        moderation: {
          action: 'HIDDEN',
          timestamp: new Date().toISOString(),
          reason: dto.reason,
          comment: dto.comment,
          adminId: dto.adminId
        }
      };
      
      // Save the updated review
      const updatedReview = await this.reviewRepository.save(review);
      
      authLogger.info({
        action: 'HIDE_REVIEW',
        reviewId,
        adminId: dto.adminId,
        reason: dto.reason
      }, `Review ${reviewId} hidden by admin ${dto.adminId}`);
      
      return updatedReview;
    } catch (error) {
      authLogger.error({
        action: 'HIDE_REVIEW_FAILED',
        reviewId,
        adminId: dto.adminId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, `Failed to hide review ${reviewId}`);
      
      throw error;
    }
  }

  /**
   * Restore a hidden review (set isPublished to true)
   */
  async restoreReview(reviewId: string, dto: ModerationActionDto): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
      
      if (!review) {
        throw new Error('Review not found');
      }

      // Set review as published
      review.isPublished = true;
      
      // Add moderation metadata
      review.metadata = {
        ...review.metadata,
        moderation: {
          action: 'RESTORED',
          timestamp: new Date().toISOString(),
          reason: dto.reason,
          comment: dto.comment,
          adminId: dto.adminId,
          previousAction: review.metadata?.moderation?.action
        }
      };
      
      // Save the updated review
      const updatedReview = await this.reviewRepository.save(review);
      
      authLogger.info({
        action: 'RESTORE_REVIEW',
        reviewId,
        adminId: dto.adminId
      }, `Review ${reviewId} restored by admin ${dto.adminId}`);
      
      return updatedReview;
    } catch (error) {
      authLogger.error({
        action: 'RESTORE_REVIEW_FAILED',
        reviewId,
        adminId: dto.adminId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, `Failed to restore review ${reviewId}`);
      
      throw error;
    }
  }

  /**
   * Permanently delete a review
   */
  async deleteReview(reviewId: string, dto: ModerationActionDto): Promise<boolean> {
    try {
      const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
      
      if (!review) {
        throw new Error('Review not found');
      }

      // Store product ID for rating update
      const productId = review.productId;
      
      // Log moderation action before deletion
      authLogger.info({
        action: 'DELETE_REVIEW',
        reviewId,
        adminId: dto.adminId,
        reason: dto.reason,
        userId: review.userId,
        productId: review.productId
      }, `Review ${reviewId} permanently deleted by admin ${dto.adminId}`);
      
      // Delete the review
      await this.reviewRepository.remove(review);
      
      // Update product rating
      await this.reviewService['updateProductRating'](productId);
      
      return true;
    } catch (error) {
      authLogger.error({
        action: 'DELETE_REVIEW_FAILED',
        reviewId,
        adminId: dto.adminId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, `Failed to delete review ${reviewId}`);
      
      throw error;
    }
  }

  /**
   * Get reviews flagged for moderation
   * (e.g., reviews with reports or specific metadata flags)
   */
  async getFlaggedReviews(page: number = 1, limit: number = 20): Promise<[Review[], number]> {
    try {
      // Find reviews that have been reported or flagged
      const [reviews, count] = await this.reviewRepository.findAndCount({
        where: [
          { metadata: { isFlagged: true } },
          { metadata: { hasReports: true } }
        ],
        skip: (page - 1) * limit,
        take: limit,
        order: {
          createdAt: 'DESC'
        }
      });
      
      return [reviews, count];
    } catch (error) {
      authLogger.error({
        action: 'GET_FLAGGED_REVIEWS_FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to get flagged reviews');
      
      throw error;
    }
  }

  /**
   * Flag a review for moderation
   */
  async flagReview(reviewId: string, reason: string, reporterId?: string): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
      
      if (!review) {
        throw new Error('Review not found');
      }

      // Create or update reports in metadata
      const reports = review.metadata?.reports || [];
      reports.push({
        timestamp: new Date().toISOString(),
        reason,
        reporterId
      });
      
      review.metadata = {
        ...review.metadata,
        isFlagged: true,
        hasReports: true,
        reports
      };
      
      // Save the updated review
      const updatedReview = await this.reviewRepository.save(review);
      
      authLogger.info({
        action: 'FLAG_REVIEW',
        reviewId,
        reporterId
      }, `Review ${reviewId} flagged for moderation`);
      
      return updatedReview;
    } catch (error) {
      authLogger.error({
        action: 'FLAG_REVIEW_FAILED',
        reviewId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, `Failed to flag review ${reviewId}`);
      
      throw error;
    }
  }
} 