import { AppDataSource } from '../config/dataSource';
import { ProductReview } from '../entities/ProductReview';
import { Product } from '../entities/Product';

export class ReviewService {
  private reviewRepo = AppDataSource.getRepository(ProductReview);
  private productRepo = AppDataSource.getRepository(Product);

  async createReview(productId: string, data: {
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    images?: string[];
    isVerifiedPurchase?: boolean;
  }) {
    const product = await this.productRepo.findOneOrFail({ where: { id: productId } });
    
    const review = this.reviewRepo.create({
      ...data,
      product
    });

    await this.reviewRepo.save(review);

    // Update product rating and review count
    const reviews = await this.reviewRepo.find({ where: { product: { id: productId } } });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;

    await this.productRepo.update(productId, {
      rating: avgRating,
      reviewCount: reviews.length
    });

    return review;
  }

  async listProductReviews(productId: string, options?: {
    skip?: number;
    take?: number;
    isPublished?: boolean;
  }) {
    return this.reviewRepo.find({
      where: {
        product: { id: productId },
        isPublished: options?.isPublished ?? true
      },
      skip: options?.skip,
      take: options?.take,
      order: { helpfulCount: 'DESC', createdAt: 'DESC' }
    });
  }

  async getReviewById(id: string) {
    return this.reviewRepo.findOne({
      where: { id },
      relations: ['product']
    });
  }

  async updateReview(id: string, data: Partial<{
    comment: string;
    rating: number;
    images: string[];
    isPublished: boolean;
    helpfulCount: number;
  }>) {
    const review = await this.reviewRepo.findOneOrFail({ where: { id } });
    Object.assign(review, data);
    await this.reviewRepo.save(review);

    if (data.rating) {
      const reviews = await this.reviewRepo.find({ 
        where: { product: { id: review.product.id } } 
      });
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;
      await this.productRepo.update(review.product.id, { rating: avgRating });
    }

    return review;
  }

  async deleteReview(id: string) {
    const review = await this.reviewRepo.findOneOrFail({ 
      where: { id },
      relations: ['product']
    });
    await this.reviewRepo.remove(review);

    // Update product rating and review count
    const reviews = await this.reviewRepo.find({ 
      where: { product: { id: review.product.id } } 
    });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length ? totalRating / reviews.length : 0;

    await this.productRepo.update(review.product.id, {
      rating: avgRating,
      reviewCount: reviews.length
    });

    return true;
  }

  async markReviewHelpful(id: string) {
    const review = await this.reviewRepo.findOneOrFail({ where: { id } });
    review.helpfulCount += 1;
    return this.reviewRepo.save(review);
  }
} 