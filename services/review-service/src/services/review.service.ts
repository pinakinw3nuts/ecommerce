import { Repository, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Review, ProductRating } from '../entities';
import { calculateAverageRating } from '../utils/average';
import { dbLogger } from '../utils/logger';

// DTOs for service methods
export interface CreateReviewDto {
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  isVerifiedPurchase?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
  isPublished?: boolean;
  metadata?: Record<string, any>;
}

export interface ReviewFilters {
  productId?: string;
  userId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isPublished?: boolean;
  isVerifiedPurchase?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export class ReviewService {
  private reviewRepository: Repository<Review>;
  private productRatingRepository: Repository<ProductRating>;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.productRatingRepository = AppDataSource.getRepository(ProductRating);
  }

  /**
   * Create a new review
   */
  async createReview(dto: CreateReviewDto): Promise<Review> {
    try {
      // Check if user already reviewed this product
      const existingReview = await this.reviewRepository.findOne({
        where: {
          userId: dto.userId,
          productId: dto.productId
        }
      });

      if (existingReview) {
        throw new Error('User has already reviewed this product');
      }

      // Create new review
      const review = new Review();
      review.userId = dto.userId;
      review.productId = dto.productId;
      review.rating = dto.rating;
      review.comment = dto.comment;
      review.isVerifiedPurchase = dto.isVerifiedPurchase || false;
      review.metadata = dto.metadata || {};

      // Save review
      const savedReview = await this.reviewRepository.save(review);
      dbLogger.info(`Created review ${savedReview.id} for product ${dto.productId} by user ${dto.userId}`);

      // Update product rating
      await this.updateProductRating(dto.productId);

      return savedReview;
    } catch (error) {
      dbLogger.error('Failed to create review:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: dto.userId,
        productId: dto.productId
      });
      throw error;
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string): Promise<Review | null> {
    try {
      return await this.reviewRepository.findOne({ where: { id } });
    } catch (error) {
      dbLogger.error(`Failed to get review ${id}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get reviews with filters and pagination
   */
  async getReviews(
    filters: ReviewFilters = {},
    pagination: PaginationOptions
  ): Promise<[Review[], number]> {
    try {
      const where: FindOptionsWhere<Review> = {};
      
      // Apply filters
      if (filters.productId) {
        where.productId = filters.productId;
      }
      
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.rating !== undefined) {
        where.rating = filters.rating;
      } else {
        if (filters.minRating !== undefined) {
          where.rating = MoreThanOrEqual(filters.minRating);
        }
        
        if (filters.maxRating !== undefined) {
          where.rating = LessThanOrEqual(filters.maxRating);
        }
      }
      
      if (filters.isPublished !== undefined) {
        where.isPublished = filters.isPublished;
      }
      
      if (filters.isVerifiedPurchase !== undefined) {
        where.isVerifiedPurchase = filters.isVerifiedPurchase;
      }
      
      if (filters.startDate || filters.endDate) {
        where.createdAt = Between(
          filters.startDate || new Date(0),
          filters.endDate || new Date()
        );
      }

      // Execute query with pagination
      const [reviews, total] = await this.reviewRepository.findAndCount({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        order: {
          [pagination.sortBy || 'createdAt']: pagination.order || 'DESC',
        },
      });

      return [reviews, total];
    } catch (error) {
      dbLogger.error('Failed to get reviews:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      });
      throw error;
    }
  }

  /**
   * Update a review
   */
  async updateReview(id: string, userId: string, dto: UpdateReviewDto): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({ where: { id } });
      
      if (!review) {
        throw new Error('Review not found');
      }
      
      // Ensure user owns this review
      if (review.userId !== userId) {
        throw new Error('Not authorized to update this review');
      }

      // Update fields if provided
      if (dto.rating !== undefined) {
        review.rating = dto.rating;
      }
      
      if (dto.comment !== undefined) {
        review.comment = dto.comment;
      }
      
      if (dto.isPublished !== undefined) {
        review.isPublished = dto.isPublished;
      }
      
      if (dto.metadata) {
        review.metadata = { ...review.metadata, ...dto.metadata };
      }

      // Save updated review
      const updatedReview = await this.reviewRepository.save(review);
      dbLogger.info(`Updated review ${id} by user ${userId}`);
      
      // Update product rating if rating changed
      if (dto.rating !== undefined) {
        await this.updateProductRating(review.productId);
      }

      return updatedReview;
    } catch (error) {
      dbLogger.error(`Failed to update review ${id}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string, userId: string): Promise<boolean> {
    try {
      const review = await this.reviewRepository.findOne({ where: { id } });
      
      if (!review) {
        throw new Error('Review not found');
      }
      
      // Ensure user owns this review or is admin
      if (review.userId !== userId) {
        throw new Error('Not authorized to delete this review');
      }

      // Store product ID for rating update
      const productId = review.productId;
      
      // Delete review
      await this.reviewRepository.remove(review);
      dbLogger.info(`Deleted review ${id} by user ${userId}`);
      
      // Update product rating
      await this.updateProductRating(productId);

      return true;
    } catch (error) {
      dbLogger.error(`Failed to delete review ${id}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Publish or unpublish a review (admin only)
   */
  async moderateReview(id: string, isPublished: boolean): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({ where: { id } });
      
      if (!review) {
        throw new Error('Review not found');
      }

      review.isPublished = isPublished;
      
      const updatedReview = await this.reviewRepository.save(review);
      dbLogger.info(`Review ${id} ${isPublished ? 'published' : 'unpublished'} by admin`);
      
      return updatedReview;
    } catch (error) {
      dbLogger.error(`Failed to moderate review ${id}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get product rating summary
   */
  async getProductRating(productId: string): Promise<ProductRating | null> {
    try {
      return await this.productRatingRepository.findOne({ where: { productId } });
    } catch (error) {
      dbLogger.error(`Failed to get product rating for ${productId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update product rating based on all reviews
   */
  private async updateProductRating(productId: string): Promise<void> {
    try {
      // Get all published reviews for this product
      const reviews = await this.reviewRepository.find({
        where: {
          productId,
          isPublished: true
        }
      });

      // Extract ratings
      const ratings = reviews.map(review => review.rating);
      
      // Get or create product rating
      let productRating = await this.productRatingRepository.findOne({
        where: { productId }
      });
      
      if (!productRating) {
        productRating = new ProductRating();
        productRating.productId = productId;
      }
      
      // Update rating stats
      productRating.updateRatingStats(ratings);
      
      // Save updated rating
      await this.productRatingRepository.save(productRating);
      dbLogger.info(`Updated rating for product ${productId}: ${productRating.averageRating} (${productRating.reviewCount} reviews)`);
    } catch (error) {
      dbLogger.error(`Failed to update product rating for ${productId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
} 