import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { mockJwt, mockAdminJwt } from './setup';
import { vi } from 'vitest';

/**
 * Create a test app instance with pre-configured mocks
 */
export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  
  // Add a hook to inject mock JWT token for all requests
  app.addHook('onRequest', async (request) => {
    request.headers = {
      ...request.headers,
      authorization: `Bearer ${mockJwt}`
    };
  });

  return app;
}

/**
 * Create a test app instance with admin JWT token
 */
export async function createAdminTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  
  // Add a hook to inject mock admin JWT token for all requests
  app.addHook('onRequest', async (request) => {
    request.headers = {
      ...request.headers,
      authorization: `Bearer ${mockAdminJwt}`
    };
  });

  return app;
}

/**
 * Mock review data for testing
 */
export const mockReview = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: '123456789',
  productId: '987654321',
  rating: 4,
  comment: 'This is a test review',
  isPublished: true,
  isVerifiedPurchase: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock review data array for testing
 */
export const mockReviews = [
  mockReview,
  {
    ...mockReview,
    id: '223e4567-e89b-12d3-a456-426614174001',
    rating: 5,
    comment: 'Another test review'
  },
  {
    ...mockReview,
    id: '323e4567-e89b-12d3-a456-426614174002',
    rating: 3,
    comment: 'A third test review'
  }
];

/**
 * Mock product rating data for testing
 */
export const mockProductRating = {
  productId: '987654321',
  averageRating: 4.0,
  totalReviews: 3,
  ratingDistribution: {
    '1': 0,
    '2': 0,
    '3': 1,
    '4': 1,
    '5': 1
  },
  updatedAt: new Date()
}; 