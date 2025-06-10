'use client';

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { API_GATEWAY_URL, ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from './constants';
import { Product, RelatedProduct, Review } from './types';

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

// Process the queue of failed requests
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.config.headers.Authorization = `Bearer ${token}`;
      promise.resolve(axios(promise.config));
    }
  });
  
  failedQueue = [];
};

// Create a server-side compatible API instance
const createAPI = () => {
  // Force IPv4 address for local development
  const baseURL = typeof window !== 'undefined' 
    ? '/api' // Client-side: Use relative URL
    : process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3003/api/v1' // Server-side development (using IPv4 explicitly)
      : API_GATEWAY_URL; // Server-side in Docker/production
      
  const api = axios.create({
    baseURL: baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Important: Always send cookies with requests
    timeout: 10000,
  });
  
  // Add request interceptor
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get token from cookies (try both standard and client cookies)
      const token = Cookies.get(ACCESS_TOKEN_NAME) || Cookies.get(`${ACCESS_TOKEN_NAME}_client`);
      
      // If token exists, add it to headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add cache control headers
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
      
      return config;
    }, 
    error => Promise.reject(error)
  );
  
  // Add response interceptor
  api.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
      // If error is not 401 or request has already been retried, reject
      if (!error.response || error.response.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      // If already refreshing, add request to queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      // Mark as refreshing
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token
        const refreshToken = Cookies.get(REFRESH_TOKEN_NAME) || Cookies.get(`${REFRESH_TOKEN_NAME}_client`);
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Use absolute URL for refresh token endpoint to avoid path issues
        const refreshUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/auth/refresh-token`
          : '/api/auth/refresh-token';

        // Call refresh token endpoint
        const { data } = await axios.post(refreshUrl, { refreshToken }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          withCredentials: true // Important: Send cookies with the request
        });
        
        // Save new tokens - cookies should be set by the server, but we'll also set them client-side as backup
        Cookies.set(ACCESS_TOKEN_NAME, data.accessToken, { 
          expires: 1/48, // 30 minutes (changed from 15 minutes)
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
        
        Cookies.set(REFRESH_TOKEN_NAME, data.refreshToken, { 
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
        
        // Also set client-accessible cookies
        Cookies.set(`${ACCESS_TOKEN_NAME}_client`, data.accessToken, { 
          expires: 1/48, // 30 minutes
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
        
        Cookies.set(`${REFRESH_TOKEN_NAME}_client`, data.refreshToken, { 
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        // Process queue with new token
        processQueue(null, data.accessToken);
        
        // Reset refreshing flag
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens
        Cookies.remove(ACCESS_TOKEN_NAME, { path: '/' });
        Cookies.remove(REFRESH_TOKEN_NAME, { path: '/' });
        Cookies.remove(`${ACCESS_TOKEN_NAME}_client`, { path: '/' });
        Cookies.remove(`${REFRESH_TOKEN_NAME}_client`, { path: '/' });
        
        // Process queue with error
        processQueue(refreshError as Error);
        
        // Reset refreshing flag
        isRefreshing = false;
        
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
          window.location.href = loginUrl;
        }
        
        return Promise.reject(refreshError);
      }
    }
  );
  
  return api;
};

const api = createAPI();

// Product API helper functions
export const productAPI = {
  /**
   * Get product by slug
   */
  getProductBySlug: async (slug: string): Promise<Product> => {
    const response = await api.get(`/products/${slug}`);
    return response.data;
  },

  /**
   * Get related products for a product
   */
  getRelatedProducts: async (slug: string): Promise<RelatedProduct[]> => {
    const response = await api.get(`/products/related/${slug}`);
    return response.data.relatedProducts;
  },

  /**
   * Get reviews for a product by ID
   */
  getProductReviews: async (productId: string, options?: {
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
    rating?: number;
    verified?: boolean;
  }): Promise<{
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    productRating: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<string, number>;
    };
  }> => {
    const params = new URLSearchParams();
    
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.sort) params.append('sort', options.sort);
    if (options?.rating) params.append('rating', options.rating.toString());
    if (options?.verified !== undefined) params.append('verified', options.verified.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/reviews/product/${productId}${queryString}`);
    return response.data;
  },
  
  /**
   * Get reviews for a product by slug
   */
  getProductReviewsBySlug: async (slug: string, options?: {
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
    rating?: number;
    verified?: boolean;
  }): Promise<{
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    productRating: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<string, number>;
    };
  }> => {
    const params = new URLSearchParams();
    
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.sort) params.append('sort', options.sort);
    if (options?.rating) params.append('rating', options.rating.toString());
    if (options?.verified !== undefined) params.append('verified', options.verified.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/reviews/product-slug/${slug}${queryString}`);
    return response.data;
  }
};

export const get = api.get;
export const post = api.post;
export const put = api.put;
export const del = api.delete;
export default api; 