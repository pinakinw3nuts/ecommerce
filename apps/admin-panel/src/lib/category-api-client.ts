import axios from 'axios';
import Cookies from 'js-cookie';
import { CategoryListingParams, CategoryListingResponse, Category, CreateCategoryData, UpdateCategoryData } from '../types/category';

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

export const categoryApi = {
  // List categories with filtering
  listCategories: async (params: CategoryListingParams): Promise<CategoryListingResponse> => {
    const queryParams = new URLSearchParams();
    
    // Add all params to query string
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.statuses?.length) queryParams.append('status', params.statuses.join(','));
    if (params.parentId !== undefined) queryParams.append('parentId', params.parentId?.toString() || 'null');
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get(`/api/v1/categories?${queryParams.toString()}`);
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/api/v1/categories/${id}`);
    return response.data;
  },

  // Create new category
  createCategory: async (data: CreateCategoryData): Promise<Category> => {
    const response = await apiClient.post('/api/v1/categories', data);
    return response.data;
  },

  // Update category
  updateCategory: async (id: string, data: UpdateCategoryData): Promise<Category> => {
    const response = await apiClient.put(`/api/v1/categories/${id}`, data);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/categories/${id}`);
  },

  // Bulk delete categories
  bulkDeleteCategories: async (ids: string[]): Promise<void> => {
    await apiClient.post('/api/v1/categories/bulk-delete', { categoryIds: ids });
  },

  // Export categories
  exportCategories: async (ids: string[] | 'all'): Promise<Blob> => {
    const response = await apiClient.post<Blob>('/api/v1/categories/export', 
      { categoryIds: ids },
      { responseType: 'blob' }
    );
    return response.data;
  }
}; 