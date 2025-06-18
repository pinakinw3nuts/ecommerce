import { createApiClient } from '../lib/apiClient';

const productServiceApi = createApiClient(process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3003/api/v1');

export const fetchProducts = async (params?: any) => {
  const searchParams = new URLSearchParams(params).toString();
  return productServiceApi.get(`/products?${searchParams}`);
};

export const fetchProductById = async (productId: string) => {
  return productServiceApi.get(`/products/${productId}`);
};

export const searchProducts = async (query: string) => {
  return productServiceApi.get(`/products/search?query=${query}`);
};

export const fetchProductReviews = async (productId: string) => {
  return productServiceApi.get(`/products/${productId}/reviews`);
}; 