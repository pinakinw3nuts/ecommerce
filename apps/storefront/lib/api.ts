'use client';

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { API_GATEWAY_URL, ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from './constants';

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
  const api = axios.create({
    baseURL: API_GATEWAY_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Important: Always send cookies with requests
    timeout: 10000,
  });
  
  // Add request interceptor
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get token from cookies
      const token = Cookies.get(ACCESS_TOKEN_NAME);
      
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
        const refreshToken = Cookies.get(REFRESH_TOKEN_NAME);
        
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
          expires: 1/96, // 15 minutes
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

export const get = api.get;
export const post = api.post;
export const put = api.put;
export const del = api.delete;
export default api; 