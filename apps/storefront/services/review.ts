import { createApiClient } from '../lib/apiClient';

const reviewServiceApi = createApiClient(process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL || 'http://localhost:3010/api/v1');

export const submitReview = async (reviewData: any) => {
  return reviewServiceApi.post('/reviews', reviewData);
};

export const getProductReviews = async (productId: string) => {
  return reviewServiceApi.get(`/reviews/product/${productId}`);
};

export const getUserReviews = async (userId: string) => {
  return reviewServiceApi.get(`/reviews/user/${userId}`);
};

export const updateReview = async (reviewId: string, reviewData: any) => {
  return reviewServiceApi.put(`/reviews/${reviewId}`, reviewData);
};

export const deleteReview = async (reviewId: string) => {
  return reviewServiceApi.delete(`/reviews/${reviewId}`);
}; 