import axios, { AxiosError, AxiosResponse } from 'axios';
import { PaginationResponse } from '@/types/payment';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
  withCredentials: true, // Include cookies in requests
});

/**
 * Get the API base URL from environment variables
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
}

// Request interceptor for handling requests
api.interceptors.request.use(
  (config) => {
    // No need to manually add the token
    // The HTTP-only cookie will be sent automatically with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized access
          window.location.href = '/auth/login';
          break;
        case 403:
          // Handle forbidden access
          console.error('Forbidden access:', error.response.data);
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

// Type definitions for API responses
export interface ApiResponse<T = any> {
  data?: T;
  items?: T extends any[] ? T : never;
  pagination?: PaginationResponse;
  message?: string;
  error?: string;
}

// API wrapper functions with type safety
export const apiClient = {
  get: async <T>(url: string, config = {}) => {
    const response = await api.get<any, T>(url, config);
    return response;
  },

  post: async <T>(url: string, data = {}, config = {}) => {
    const response = await api.post<any, T>(url, data, config);
    return response;
  },

  put: async <T>(url: string, data = {}, config = {}) => {
    const response = await api.put<any, T>(url, data, config);
    return response;
  },

  delete: async <T>(url: string, config = {}) => {
    const response = await api.delete<any, T>(url, config);
    return response;
  },

  patch: async <T>(url: string, data = {}, config = {}) => {
    const response = await api.patch<any, T>(url, data, config);
    return response;
  },
};

// Example usage:
// const data = await apiClient.get<User[]>('/users');
// const user = await apiClient.post<User>('/users', { name: 'John' });

export default apiClient; 