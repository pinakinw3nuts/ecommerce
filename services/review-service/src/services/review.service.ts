import { FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { getRepository } from '../config/database';
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

// Define API Gateway URL
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

export interface ReviewFilterOptions {
  productId?: string;
  userId?: string;
  rating?: number;
  isVerifiedPurchase?: boolean;
  isPublished?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface ReviewSortOptions {
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ReviewPaginationOptions {
  page?: number;
  limit?: number;
}

// Define rating distribution type
export interface RatingDistribution {
  [key: string]: number;
}

export class ReviewService {
  private reviewRepo = getRepository(Review);
  private productRatingRepo = getRepository(ProductRating);

  /**
   * Create a new review
   */
  async createReview(data: {
    userId: string;
    productId: string;
    rating: number;
    comment?: string;
    isVerifiedPurchase?: boolean;
  }): Promise<Review> {
    dbLogger.info({ userId: data.userId, productId: data.productId }, 'Creating new review');
    
    // Create review entity
    const review = this.reviewRepo.create({
      userId: data.userId,
      productId: data.productId,
      rating: data.rating,
      comment: data.comment,
      isVerifiedPurchase: data.isVerifiedPurchase ?? false,
      isPublished: true
    });
    
    // Save review
    const savedReview = await this.reviewRepo.save(review);
    
    // Update product rating
    await this.updateProductRating(data.productId);
    
    dbLogger.info({ reviewId: savedReview.id }, 'Review created successfully');
    
    return savedReview;
  }

  /**
   * Get a review by ID
   */
  async getReviewById(id: string): Promise<Review | null> {
    dbLogger.info({ reviewId: id }, 'Getting review by ID');
    
    return this.reviewRepo.findOne({
      where: { id }
    });
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
      const [reviews, total] = await this.reviewRepo.findAndCount({
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
  async updateReview(id: string, userId: string, data: {
    rating?: number;
    comment?: string;
    isPublished?: boolean;
  }): Promise<Review | null> {
    dbLogger.info({ reviewId: id, userId }, 'Updating review');
    
    // Find review to ensure it exists and belongs to the user
    const review = await this.reviewRepo.findOne({
      where: { id, userId }
    });
    
    if (!review) {
      dbLogger.warn({ reviewId: id, userId }, 'Review not found or does not belong to user');
      return null;
    }
    
    // Update review
    const updateResult = await this.reviewRepo.update(
      { id },
      { 
        rating: data.rating !== undefined ? data.rating : review.rating,
        comment: data.comment !== undefined ? data.comment : review.comment,
        isPublished: data.isPublished !== undefined ? data.isPublished : review.isPublished,
        updatedAt: new Date()
      }
    );
    
    if (updateResult.affected === 0) {
      dbLogger.warn({ reviewId: id }, 'Review update failed');
      return null;
    }
    
    // If rating changed, update product rating
    if (data.rating !== undefined && data.rating !== review.rating) {
      await this.updateProductRating(review.productId);
    }
    
    // Get updated review
    const updatedReview = await this.reviewRepo.findOne({
      where: { id }
    });
    
    dbLogger.info({ reviewId: id }, 'Review updated successfully');
    
    return updatedReview;
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string, userId: string): Promise<boolean> {
    dbLogger.info({ reviewId: id, userId }, 'Deleting review');
    
    // Find review to ensure it exists and belongs to the user
    const review = await this.reviewRepo.findOne({
      where: { id, userId }
    });
    
    if (!review) {
      dbLogger.warn({ reviewId: id, userId }, 'Review not found or does not belong to user');
      return false;
    }
    
    // Delete review
    const deleteResult = await this.reviewRepo.delete({ id });
    
    if (deleteResult.affected === 0) {
      dbLogger.warn({ reviewId: id }, 'Review deletion failed');
      return false;
    }
    
    // Update product rating
    await this.updateProductRating(review.productId);
    
    dbLogger.info({ reviewId: id }, 'Review deleted successfully');
    
    return true;
  }

  /**
   * Publish or unpublish a review (admin only)
   */
  async moderateReview(id: string, isPublished: boolean): Promise<Review> {
    try {
      const review = await this.reviewRepo.findOne({ where: { id } });
      
      if (!review) {
        throw new Error('Review not found');
      }

      review.isPublished = isPublished;
      
      const updatedReview = await this.reviewRepo.save(review);
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
   * List reviews with filtering, sorting, and pagination
   */
  async listReviews(options?: {
    filters?: ReviewFilterOptions;
    sort?: ReviewSortOptions;
    pagination?: ReviewPaginationOptions;
  }): Promise<{ reviews: Review[]; total: number }> {
    const {
      filters = {},
      sort = { sortBy: 'createdAt', sortOrder: 'DESC' },
      pagination = { page: 1, limit: 20 }
    } = options || {};
    
    // Set default pagination values
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const where: FindOptionsWhere<Review> = {};
    
    if (filters.productId) {
      where.productId = filters.productId;
    }
    
    if (filters.userId) {
      where.userId = filters.userId;
    }
    
    if (filters.rating) {
      where.rating = filters.rating;
    }
    
    if (filters.isVerifiedPurchase !== undefined) {
      where.isVerifiedPurchase = filters.isVerifiedPurchase;
    }
    
    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }
    
    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = Between(
        filters.createdAfter || new Date(0),
        filters.createdBefore || new Date()
      );
    }
    
    // Build order conditions
    const order: Record<string, 'ASC' | 'DESC'> = {
      [sort.sortBy || 'createdAt']: sort.sortOrder || 'DESC'
    };
    
    // Execute query
    const [reviews, total] = await this.reviewRepo.findAndCount({
      where,
      order,
      skip: offset,
      take: limit
    });
    
    dbLogger.info({ 
      filters: JSON.stringify(filters), 
      page, 
      limit, 
      total 
    }, 'Listed reviews');
    
    return { reviews, total };
  }

  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: string, options?: {
    sort?: ReviewSortOptions;
    pagination?: ReviewPaginationOptions;
    rating?: number;
    verified?: boolean;
  }): Promise<{ reviews: Review[]; total: number }> {
    const {
      sort = { sortBy: 'createdAt', sortOrder: 'DESC' },
      pagination = { page: 1, limit: 20 },
      rating,
      verified
    } = options || {};
    
    // Set up filters
    const filters: ReviewFilterOptions = {
      productId,
      isPublished: true
    };
    
    if (rating) {
      filters.rating = rating;
    }
    
    if (verified !== undefined) {
      filters.isVerifiedPurchase = verified;
    }
    
    return this.listReviews({
      filters,
      sort,
      pagination
    });
  }

  /**
   * Get product reviews by slug
   */
  async getProductReviewsBySlug(slug: string, options?: {
    sort?: ReviewSortOptions;
    pagination?: ReviewPaginationOptions;
    rating?: number;
    verified?: boolean;
  }): Promise<{ reviews: Review[]; total: number; productId: string }> {
    try {
      // Get product ID from product service using the slug via API Gateway
      const response = await fetch(`${API_GATEWAY_URL}/products/${slug}`, {
        method: 'GET',
        headers: {
          'X-Service-Token': process.env.SERVICE_TOKEN || 'review-service-token',
          'X-Service-Name': 'review-service',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Product not found: ${response.status}`);
      }
      
      const productData = await response.json();
      
      const productId = productData.id;
      
      if (!productId) {
        throw new Error('Product not found');
      }
      
      // Get reviews
      const { reviews, total } = await this.getProductReviews(productId, options);
      
      return { reviews, total, productId };
    } catch (error) {
      dbLogger.error(error, 'Error getting product by slug');
      throw new Error('Product not found');
    }
  }

  /**
   * Get product rating
   */
  async getProductRating(productId: string): Promise<{
    productId: string;
    averageRating: number;
    reviewCount: number;
    ratingDistribution: RatingDistribution;
  }> {
    dbLogger.info({ productId }, 'Getting product rating');
    
    // Get the product rating from the database
    const productRating = await this.productRatingRepo.findOne({
      where: { productId }
    });
    
    // If not found, return default values
    if (!productRating) {
      return {
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
      };
    }
    
    return {
      productId: productRating.productId,
      averageRating: productRating.averageRating,
      reviewCount: productRating.reviewCount,
      ratingDistribution: productRating.ratingDistribution
    };
  }

  /**
   * Update product rating
   */
  private async updateProductRating(productId: string): Promise<void> {
    try {
      dbLogger.info({ productId }, 'Updating product rating');
      
      // Get all published reviews for the product
      const reviews = await this.reviewRepo.find({
        where: { productId, isPublished: true }
      });
      
      // Calculate average rating
      const averageRating = calculateAverageRating(reviews.map(r => r.rating));
      
      // Calculate rating distribution
      const ratingDistribution: RatingDistribution = {};
      
      // Initialize distribution with zeros
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i.toString()] = 0;
      }
      
      // Count ratings
      reviews.forEach(review => {
        const rating = review.rating.toString();
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });
      
      // Find existing rating or create new one
      let productRating = await this.productRatingRepo.findOne({
        where: { productId }
      });
      
      if (!productRating) {
        productRating = this.productRatingRepo.create({
          productId
        });
      }
      
      // Update rating properties
      productRating.averageRating = averageRating;
      productRating.reviewCount = reviews.length;
      productRating.ratingDistribution = ratingDistribution;
      
      // Save the rating
      await this.productRatingRepo.save(productRating);
      
      dbLogger.info({ 
        productId, 
        averageRating, 
        reviewCount: reviews.length 
      }, 'Updated product rating');
    } catch (error) {
      dbLogger.error(error, 'Error updating product rating');
    }
  }
} 