import { cookies } from 'next/headers';
import axios from 'axios';
import apiClient from '@/lib/apiClient';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

// Internal API response product interface
interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  slug: string;
  mediaUrl?: string;
  isFeatured: boolean;
  isPublished: boolean;
  category: {
    id: string;
    name: string;
    description?: string;
  };
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
  }>;
  tags?: Array<{
    id: string;
    name: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

// UI product interface used in product page
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  mediaUrl?: string; // Added mediaUrl property from API response
  isPublished: boolean;
  isFeatured: boolean;
  slug: string;
  category: string | { id: string; name: string; description?: string };
  createdAt: string;
  updatedAt: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

interface ApiProductsResponse {
  products: ApiProduct[];
  pagination: PaginationInfo;
}

export interface ProductQueryParams {
  [key: string]: any; // Allow dynamic properties
  page?: number;
  pageSize?: number;
  search?: string;
  categories?: string[];
  statuses?: string[];
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isFeatured?: string[];
  isPublished?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
}

// Client-side function to get auth token from cookies
function getClientAuthToken() {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('admin_token='))
    ?.split('=')[1];
  
  return token;
}

// Server-side function to get auth token from cookies
async function getServerAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_token')?.value;
}

// Helper function to determine if code is running on server or client
function isServer() {
  return typeof window === 'undefined';
}

// Generic API client for both server and client side
async function makeRequest(url: string, options: RequestInit = {}) {
  try {
    // Get auth token based on environment
    const token = isServer() 
      ? await getServerAuthToken()
      : getClientAuthToken();
    
    console.log(`Making request to: ${url}`, {
      method: options.method || 'GET',
    });
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      let errorMessage;
      try {
        // Try to get detailed error message from response
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `Request failed with status: ${response.status}`;
        
        // Handle token expiration
        if (response.status === 401 && (
          errorData?.code === 'TOKEN_EXPIRED' ||
          errorData?.message?.toLowerCase().includes('expired') ||
          errorData?.message?.toLowerCase().includes('invalid token')
        )) {
          if (!isServer()) {
            // Instead of redirecting to login, let apiClient handle token refresh
            throw new Error('TOKEN_EXPIRED');
          }
        }
      } catch (e) {
        // If parsing JSON fails, use status text
        errorMessage = `Request failed with status: ${response.status} ${response.statusText}`;
      }
      
      console.error('API response error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log(`Request to ${url} succeeded with status: ${response.status}`);
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Transform API product to UI product
function transformProduct(apiProduct: ApiProduct): Product {
  // Calculate total stock from variants or default to 0
  const totalStock = apiProduct.variants?.reduce((sum, variant) => sum + variant.stock, 0) || 0;
  
  // Determine product status based on stock
  let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'out_of_stock';
  if (totalStock > 20) {
    status = 'in_stock';
  } else if (totalStock > 0) {
    status = 'low_stock';
  }
  
  // Create default date strings if not provided by API
  const now = new Date().toISOString();
  
  // Safely extract category name
  let categoryName = 'Uncategorized';
  if (apiProduct.category) {
    if (typeof apiProduct.category === 'string') {
      categoryName = apiProduct.category;
    } else if (typeof apiProduct.category === 'object' && apiProduct.category !== null) {
      categoryName = apiProduct.category.name || 'Uncategorized';
    }
  }
  
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description,
    price: apiProduct.price,
    stock: totalStock,
    image: apiProduct.mediaUrl || '/images/placeholder.png',
    isPublished: apiProduct.isPublished,
    isFeatured: apiProduct.isFeatured,
    slug: apiProduct.slug,
    category: categoryName,
    createdAt: apiProduct.createdAt || now,
    updatedAt: apiProduct.updatedAt || now,
    status
  };
}

/**
 * Build query string from parameters
 */
function buildQueryString(params: ProductQueryParams): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    
    // Map pageSize to limit for backend compatibility
    const paramKey = key === 'pageSize' ? 'limit' : key;
    
    // Special handling for category filters
    if (key === 'categories' && Array.isArray(value) && value.length > 0) {
      if (value.length === 1) {
        // Single category - use categoryId
        queryParams.append('categoryId', value[0].toString());
      } else {
        // Multiple categories - use categoryIds
        queryParams.append('categoryIds', value.join(','));
      }
      return;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return;
      }
      
      // For isFeatured and isPublished, use the first value directly
      if ((key === 'isFeatured' || key === 'isPublished') && value.length > 0) {
        queryParams.append(paramKey, value[0].toString());
      } else {
        // Handle regular array parameters
        value.forEach(val => {
          if (val !== undefined && val !== null) {
            queryParams.append(`${paramKey}[]`, val.toString());
          }
        });
      }
    } else if (typeof value === 'boolean') {
      // Handle boolean values directly (especially for isFeatured and isPublished)
      queryParams.append(paramKey, value.toString());
    } else if (typeof value === 'object') {
      // Handle nested objects (like dateRange)
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (subValue !== undefined && subValue !== null) {
          queryParams.append(`${paramKey}.${subKey}`, subValue.toString());
        }
      });
    } else {
      queryParams.append(paramKey, value.toString());
    }
  });
  
  return queryParams.toString();
}

/**
 * Get products with pagination and filtering
 */
export async function getProducts(params: ProductQueryParams = {}): Promise<ProductsResponse> {
  if (isServer()) {
    // Server-side request
    const queryString = buildQueryString(params);
    const response = await makeRequest(`${PRODUCT_SERVICE_URL}/api/v1/admin/products?${queryString}`);
    const data = await response.json();
    
    // Handle the backend response format which uses 'data' and 'meta' keys
    const products = Array.isArray(data.data) ? data.data : [];
    const meta = data.meta || {};
    
    console.log('API Response Format:', Object.keys(data));
    console.log('Products count:', products.length);
    console.log('Meta data:', meta);
    
    return {
      products: products.map(transformProduct),
      pagination: {
        total: meta.total || 0,
        totalPages: meta.totalPages || 0,
        currentPage: meta.page || 1,
        pageSize: meta.limit || 10,
        hasMore: meta.hasNextPage || false,
        hasPrevious: meta.hasPrevPage || false
      }
    };
  } else {
    // Client-side request using apiClient with token refresh
    try {
      const response = await apiClient.get('/products', { params });
      const data = response.data;
      
      // Handle the backend response format which uses 'data' and 'meta' keys
      const products = Array.isArray(data.data) ? data.data : [];
      const meta = data.meta || {};
      
      console.log('Client-side API Response Format:', Object.keys(data));
      
      return {
        products: products.map(transformProduct),
        pagination: {
          total: meta.total || 0,
          totalPages: meta.totalPages || 0,
          currentPage: meta.page || 1,
          pageSize: meta.limit || 10,
          hasMore: meta.hasNextPage || false,
          hasPrevious: meta.hasPrevPage || false
        }
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
}

/**
 * Get a product by ID
 */
export async function getProductById(id: string): Promise<Product> {
  if (isServer()) {
    // Server-side request
    const response = await makeRequest(`${PRODUCT_SERVICE_URL}/api/v1/admin/products/${id}`);
    const data = await response.json();
    
    // Backend might return data directly or nested in a data property
    const productData = data.data || data;
    
    return transformProduct(productData);
  } else {
    // Client-side request using apiClient with token refresh
    const response = await apiClient.get(`/products/${id}`);
    
    // Backend might return data directly or nested in a data property
    const productData = response.data.data || response.data;
    
    return transformProduct(productData);
  }
}

/**
 * Create a new product
 */
export async function createProduct(productData: Partial<ApiProduct> & { 
  sku?: string; 
  stock?: number;
  categoryId?: string;
}): Promise<Product> {
  if (isServer()) {
    // Server-side request
    const response = await makeRequest(`${PRODUCT_SERVICE_URL}/api/v1/admin/products`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    const data = await response.json();
    // Backend might return data directly or nested in a data property
    const productResponse = data.data || data;
    return transformProduct(productResponse);
  } else {
    // Client-side request using apiClient with token refresh
    const response = await apiClient.post('/products', productData);
    // Backend might return data directly or nested in a data property
    const productResponse = response.data.data || response.data;
    return transformProduct(productResponse);
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, productData: Partial<ApiProduct>): Promise<Product> {
  if (isServer()) {
    // Server-side request
    const response = await makeRequest(`${PRODUCT_SERVICE_URL}/api/v1/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    const data = await response.json();
    // Backend might return data directly or nested in a data property
    const productResponse = data.data || data;
    return transformProduct(productResponse);
  } else {
    // Client-side request using apiClient with token refresh
    const response = await apiClient.put(`/products/${id}`, productData);
    // Backend might return data directly or nested in a data property
    const productResponse = response.data.data || response.data;
    return transformProduct(productResponse);
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  if (isServer()) {
    // Server-side request
    await makeRequest(`${PRODUCT_SERVICE_URL}/api/v1/admin/products/${id}`, {
      method: 'DELETE'
    });
  } else {
    // Client-side request using apiClient with token refresh
    await apiClient.delete(`/products/${id}`);
  }
}

/**
 * Update product status
 */
export async function updateProductStatus(id: string, status: string): Promise<void> {
  if (isServer()) {
    // Server-side request
    await makeRequest(`${PRODUCT_SERVICE_URL}/api/v1/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  } else {
    // Client-side request using apiClient with token refresh
    await apiClient.patch(`/products/${id}/status`, { status });
  }
}

/**
 * Bulk delete products
 */
export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  if (isServer()) {
    // Server-side request
    await makeRequest(`${PRODUCT_SERVICE_URL}/api/v1/admin/products/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  } else {
    // Client-side request using apiClient with token refresh
    await apiClient.post('/products/bulk-delete', { ids });
  }
}

/**
 * Bulk update product status
 */
export async function bulkUpdateProductStatus(ids: string[], status: string): Promise<void> {
  if (isServer()) {
    // Server-side request
    await makeRequest(`${PRODUCT_SERVICE_URL}/api/v1/admin/products/bulk-status`, {
      method: 'POST',
      body: JSON.stringify({ ids, status })
    });
  } else {
    // Client-side request using apiClient with token refresh
    await apiClient.post('/products/bulk-status', { ids, status });
  }
}

/**
 * Export products as CSV/Excel
 */
export async function exportProducts(filters?: ProductQueryParams): Promise<Blob> {
  if (isServer()) {
    throw new Error('Export is only available on the client side');
  }
  
  const queryString = filters ? buildQueryString(filters) : '';
  
  // Client-side request with token refresh and blob response
  const response = await apiClient.get(`/products/export?${queryString}`, {
    responseType: 'blob'
  });
  
  return response.data;
} 