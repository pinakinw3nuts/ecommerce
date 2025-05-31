import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ColumnType
} from 'typeorm';

/**
 * ProductRating entity for storing aggregated review statistics
 * This serves as a cache/summary of reviews for a product
 */
@Entity('product_ratings')
export class ProductRating {
  @PrimaryColumn()
  productId!: string;

  @Column('decimal', { precision: 3, scale: 1, default: 0 })
  averageRating = 0;

  @Column('integer', { default: 0 })
  reviewCount = 0;

  @Column('jsonb')
  ratingDistribution: { [key: string]: number } = {};

  @CreateDateColumn()
  createdAt = new Date();

  @UpdateDateColumn()
  updatedAt = new Date();

  /**
   * Updates the rating distribution and average
   * @param ratings Array of ratings (1-5) to calculate from
   */
  updateRatingStats(ratings: number[]): void {
    if (!ratings.length) {
      this.averageRating = 0;
      this.reviewCount = 0;
      this.ratingDistribution = {};
      return;
    }
    
    // Calculate average
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    this.averageRating = Math.round((sum / ratings.length) * 10) / 10;
    this.reviewCount = ratings.length;
    
    // Calculate distribution
    this.ratingDistribution = ratings.reduce((dist, rating) => {
      const key = rating.toString();
      dist[key] = (dist[key] || 0) + 1;
      return dist;
    }, {} as { [key: string]: number });
  }
} 