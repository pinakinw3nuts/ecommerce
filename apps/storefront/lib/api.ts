'use client';

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';

// Token name for cookies
export const TOKEN_NAME = 'accessToken';
export const REFRESH_TOKEN_NAME = 'refreshToken';

// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000/api';

// Request interceptor function
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  // Get token from cookies
  const token = Cookies.get(TOKEN_NAME);
  
  // If token exists, add it to headers
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
};

// Response interceptor factory
const createResponseInterceptor = (api: AxiosInstance) => {
  let isRefreshing = false;
  let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    
    failedQueue = [];
  };

  return async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If error is not 401 or request has already been retried, reject
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Mark request as retried
    originalRequest._retry = true;

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      // Get refresh token
      const refreshToken = Cookies.get(REFRESH_TOKEN_NAME);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh token endpoint
      const { data } = await api.post('/auth/refresh-token', { refreshToken });
      
      // Save new tokens
      Cookies.set(TOKEN_NAME, data.accessToken, { 
        expires: 1/96, // 15 minutes
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      Cookies.set(REFRESH_TOKEN_NAME, data.refreshToken, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Update authorization header
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      
      // Process queue with new token
      processQueue(null, data.accessToken);
      
      return api(originalRequest);
    } catch (refreshError) {
      // Process queue with error
      processQueue(refreshError, null);
      
      // Clear tokens
      Cookies.remove(TOKEN_NAME);
      Cookies.remove(REFRESH_TOKEN_NAME);
      
      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  };
};

// Create a server-side compatible API instance
const createAPI = () => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 10000,
  });
  
  // Add request interceptor
  api.interceptors.request.use(requestInterceptor, error => Promise.reject(error));
  
  // Add response interceptor
  api.interceptors.response.use(
    response => response,
    createResponseInterceptor(api)
  );
  
  return api;
};

const api = createAPI();

export const get = api.get;
export const post = api.post;
export const put = api.put;
export const del = api.delete;
export default api; 