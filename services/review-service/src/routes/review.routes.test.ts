import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp, mockReview, mockReviews, mockProductRating } from '@test/helpers';
import { AppDataSource } from '@config/database';
import { Review } from '@entities/Review';
import { ProductRating } from '@entities/ProductRating';

describe('Review Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      // Mock the repository save method
      const saveMock = vi.fn().mockResolvedValue(mockReview);
      vi.spyOn(AppDataSource, 'getRepository').mockImplementation(() => ({
        save: saveMock,
        findOne: vi.fn(),
        find: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        createQueryBuilder: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn()
      } as any));

      const newReview = {
        productId: '987654321',
        rating: 4,
        comment: 'This is a test review',
        isVerifiedPurchase: true
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/reviews',
        payload: newReview
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toMatchObject({
        id: expect.any(String),
        productId: newReview.productId,
        rating: newReview.rating,
        comment: newReview.comment
      });
      
      // Verify the repository was called with correct data
      expect(saveMock).toHaveBeenCalledWith(expect.objectContaining({
        productId: newReview.productId,
        rating: newReview.rating,
        comment: newReview.comment
      }));
    });

    it('should return 400 for invalid review data', async () => {
      const invalidReview = {
        productId: '987654321',
        // Missing required rating field
        comment: 'This is a test review'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/reviews',
        payload: invalidReview
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toHaveProperty('message');
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update an existing review', async () => {
      // Mock findOne to return a review
      const findOneMock = vi.fn().mockResolvedValue(mockReview);
      // Mock update to succeed
      const updateMock = vi.fn().mockResolvedValue({ affected: 1 });
      
      vi.spyOn(AppDataSource, 'getRepository').mockImplementation(() => ({
        save: vi.fn(),
        findOne: findOneMock,
        find: vi.fn(),
        update: updateMock,
        delete: vi.fn(),
        createQueryBuilder: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn()
      } as any));

      const updatedReview = {
        rating: 5,
        comment: 'Updated test review'
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/reviews/${mockReview.id}`,
        payload: updatedReview
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toMatchObject({
        id: mockReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment
      });
      
      // Verify the repository was called with correct data
      expect(findOneMock).toHaveBeenCalledWith({ where: { id: mockReview.id, userId: '123456789' } });
      expect(updateMock).toHaveBeenCalledWith(
        { id: mockReview.id },
        expect.objectContaining(updatedReview)
      );
    });

    it('should return 404 when updating non-existent review', async () => {
      // Mock findOne to return null (review not found)
      vi.spyOn(AppDataSource, 'getRepository').mockImplementation(() => ({
        save: vi.fn(),
        findOne: vi.fn().mockResolvedValue(null),
        find: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        createQueryBuilder: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn()
      } as any));

      const updatedReview = {
        rating: 5,
        comment: 'Updated test review'
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/reviews/${mockReview.id}`,
        payload: updatedReview
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toHaveProperty('message', 'Review not found');
    });
  });

  describe('GET /api/reviews/product/:productId', () => {
    it('should get reviews for a product with pagination', async () => {
      // Mock createQueryBuilder to return reviews
      const getManyAndCountMock = vi.fn().mockResolvedValue([mockReviews, mockReviews.length]);
      const createQueryBuilderMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: getManyAndCountMock
      });
      
      // Mock findOne for product rating
      const findOneMock = vi.fn().mockResolvedValue(mockProductRating);
      
      vi.spyOn(AppDataSource, 'getRepository').mockImplementation((entity) => {
        if (entity === Review) {
          return {
            save: vi.fn(),
            findOne: vi.fn(),
            find: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            createQueryBuilder: createQueryBuilderMock
          } as any;
        } else if (entity === ProductRating) {
          return {
            save: vi.fn(),
            findOne: findOneMock,
            find: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            createQueryBuilder: vi.fn()
          } as any;
        }
        return {} as any;
      });

      const productId = '987654321';
      const response = await app.inject({
        method: 'GET',
        url: `/api/reviews/product/${productId}?page=1&limit=10&sort=newest`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('reviews');
      expect(body).toHaveProperty('pagination');
      expect(body).toHaveProperty('productRating');
      
      expect(body.reviews).toHaveLength(mockReviews.length);
      expect(body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: mockReviews.length
      });
      expect(body.productRating).toMatchObject({
        averageRating: mockProductRating.averageRating,
        totalReviews: mockProductRating.totalReviews
      });
      
      // Verify query builder was called correctly
      expect(createQueryBuilderMock).toHaveBeenCalledWith('review');
    });

    it('should return empty array when no reviews found', async () => {
      // Mock createQueryBuilder to return empty array
      const getManyAndCountMock = vi.fn().mockResolvedValue([[], 0]);
      const createQueryBuilderMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: getManyAndCountMock
      });
      
      // Mock findOne for product rating to return null
      const findOneMock = vi.fn().mockResolvedValue(null);
      
      vi.spyOn(AppDataSource, 'getRepository').mockImplementation((entity) => {
        if (entity === Review) {
          return {
            save: vi.fn(),
            findOne: vi.fn(),
            find: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            createQueryBuilder: createQueryBuilderMock
          } as any;
        } else if (entity === ProductRating) {
          return {
            save: vi.fn(),
            findOne: findOneMock,
            find: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            createQueryBuilder: vi.fn()
          } as any;
        }
        return {} as any;
      });

      const productId = 'non-existent-product';
      const response = await app.inject({
        method: 'GET',
        url: `/api/reviews/product/${productId}`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('reviews');
      expect(body.reviews).toHaveLength(0);
      expect(body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 0
      });
      expect(body.productRating).toMatchObject({
        averageRating: 0,
        totalReviews: 0
      });
    });
  });
}); 