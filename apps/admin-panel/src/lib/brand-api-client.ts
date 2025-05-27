import axios from 'axios';
import Cookies from 'js-cookie';
import { BrandListingParams, BrandListingResponse, Brand, CreateBrandData, UpdateBrandData } from '../types/brand';

const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3003';
const TOKEN_COOKIE_NAME = 'admin_token';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: PRODUCT_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_COOKIE_NAME);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized access and token expiration
          if (error.response.data?.code === 'TOKEN_EXPIRED' || 
              error.response.data?.message?.toLowerCase().includes('expired') ||
              error.response.data?.message?.toLowerCase().includes('invalid token')) {
            // Clear auth state
            Cookies.remove(TOKEN_COOKIE_NAME);
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?returnUrl=${returnUrl}`;
            return Promise.reject(error);
          }
          // Handle other 401 errors
          Cookies.remove(TOKEN_COOKIE_NAME);
          window.location.href = '/login';
          break;
        case 403:
          // Handle forbidden access
          console.error('Forbidden access:', error.response.data);
          window.location.href = '/unauthorized';
          break;
        case 500:
          // Handle server errors
          console.error('Server error:', error.response.data);
          break;
        default:
          // Handle other errors
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      // Handle network errors
      console.error('Network error:', error.request);
    } else {
      // Handle other errors
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const brandApi = {
  // List brands with filtering
  listBrands: async (params: BrandListingParams): Promise<BrandListingResponse> => {
    const queryParams = new URLSearchParams();
    
    // Add all params to query string
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.statuses?.length) queryParams.append('status', params.statuses.join(','));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get(`/api/v1/brands?${queryParams.toString()}`);
    return response.data;
  },

  // Get brand by ID
  getBrandById: async (id: string): Promise<Brand> => {
    const response = await apiClient.get(`/api/v1/brands/${id}`);
    return response.data;
  },

  // Create new brand
  createBrand: async (data: CreateBrandData): Promise<Brand> => {
    const response = await apiClient.post('/api/v1/brands', data);
    return response.data;
  },

  // Update brand
  updateBrand: async (id: string, data: UpdateBrandData): Promise<Brand> => {
    const response = await apiClient.put(`/api/v1/brands/${id}`, data);
    return response.data;
  },

  // Delete brand
  deleteBrand: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/brands/${id}`);
  },

  // Bulk delete brands
  bulkDeleteBrands: async (ids: string[]): Promise<void> => {
    await apiClient.post('/api/v1/brands/bulk-delete', { brandIds: ids });
  }
}; 