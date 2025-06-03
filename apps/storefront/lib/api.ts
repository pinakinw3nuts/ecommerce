'use client';

import axios, { InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Create a server-side compatible API instance
const createAPI = () => {
  // Determine if we're on the server or client
  const isServer = typeof window === 'undefined';
  
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    withCredentials: !isServer, // Only use credentials on client-side
  });
  
  // For demo purposes, we'll skip authentication
  // In a real implementation, we would add the token to each request
  
  return api;
};

const api = createAPI();

export const get = api.get;
export const post = api.post;
export const put = api.put;
export const del = api.delete;
export default api; 