import axios from 'axios';
import Cookies from 'js-cookie';
import { UserListingParams, UserListingResponse, User, CreateUserData } from '../types/user';

const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3002';
const TOKEN_COOKIE_NAME = 'admin_token';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: USER_SERVICE_URL,
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

export const userApi = {
  // List users with filtering
  listUsers: async (params: UserListingParams): Promise<UserListingResponse> => {
    const queryParams = new URLSearchParams();
    
    // Add all params to query string
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.roles?.length) queryParams.append('role', params.roles[0]); // Only use the first role
    if (params.statuses?.length) queryParams.append('status', params.statuses.join(','));
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.country) queryParams.append('country', params.country);

    const response = await apiClient.get(`/api/v1/users?${queryParams.toString()}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/api/v1/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await apiClient.post('/api/v1/users', data);
    return response.data;
  },

  // Update user status
  updateUserStatus: async (id: string, status: string): Promise<User> => {
    const response = await apiClient.patch(`/api/v1/users/${id}/status`, { status });
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/users/${id}`);
  }
};

export default apiClient; 