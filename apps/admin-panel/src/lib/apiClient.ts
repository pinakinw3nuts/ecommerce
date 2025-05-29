'use client';

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, isTokenExpired, refreshAccessToken, isTokenExpiringSoon } from './auth';

// Create axios instance
const apiClient = axios.create({
  baseURL: '/api/v1/admin',
  timeout: 30000,
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
// Queue of requests that should be retried after token refresh
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// Process queue of failed requests
const processQueue = (error: any, token: string | null = null) => {
  refreshQueue.forEach(request => {
    if (error) {
      request.reject(error);
    } else if (token) {
      request.resolve(token);
    }
  });
  
  // Reset queue
  refreshQueue = [];
};

// Add request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Check if token exists and is about to expire
    if (isTokenExpiringSoon() && !config.url?.includes('/auth/refresh-token')) {
      try {
        // Only refresh once at a time
        if (!isRefreshing) {
          isRefreshing = true;
          // Refresh the access token
          const { accessToken } = await refreshAccessToken();
          isRefreshing = false;
          
          // Process any pending requests with new token
          processQueue(null, accessToken);
          
          // Add the new token to the current request
          config.headers.Authorization = `Bearer ${accessToken}`;
          return config;
        }
        
        // If refresh is already in progress, add request to queue
        return new Promise<typeof config>((resolve, reject) => {
          refreshQueue.push({
            resolve: (token: string) => {
              config.headers.Authorization = `Bearer ${token}`;
              resolve(config);
            },
            reject,
          });
        });
      } catch (error) {
        isRefreshing = false;
        processQueue(error);
        throw error;
      }
    }
    
    // Add token to request if available
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Extract config, response from error
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Only try to refresh the token if we get a 401 and have not already tried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      // Mark this request as retried
      originalRequest._retry = true;
      
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          // Attempt to refresh the token
          const { accessToken } = await refreshAccessToken();
          isRefreshing = false;
          
          // Update auth header with new token
          apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          
          // Process any requests that were waiting
          processQueue(null, accessToken);
          
          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          } else {
            originalRequest.headers = { Authorization: `Bearer ${accessToken}` };
          }
          
          return apiClient(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError);
          
          // If refresh fails, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
          }
          
          return Promise.reject(refreshError);
        }
      }
      
      // If refresh is already in progress, add request to queue
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            } else {
              originalRequest.headers = { Authorization: `Bearer ${token}` };
            }
            resolve(apiClient(originalRequest));
          },
          reject: (err) => reject(err),
        });
      });
    }
    
    // Return the original error if not a 401 or already retried
    return Promise.reject(error);
  }
);

export default apiClient; 