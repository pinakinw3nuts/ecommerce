import { cookies } from 'next/headers';
import axios from 'axios';

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
  image: string;
  isPublished: boolean;
  isFeatured: boolean;
  slug: string;
  category: string;
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
  page?: number;
  pageSize?: number;
  search?: string;
  categories?: string[];
  statuses?: string[];
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  const cookieStore = cookies();
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
            // Clear token and redirect to login
            document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/login';
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
    image: apiProduct.mediaUrl || '/images/placeholder-product.jpg',
    isPublished: apiProduct.isPublished,
    isFeatured: apiProduct.isFeatured || false,
    slug: apiProduct.slug || '',
    category: categoryName,
    createdAt: apiProduct.createdAt || now,
    updatedAt: apiProduct.updatedAt || now,
    status
  };
}

export async function getProducts(params: ProductQueryParams = {}): Promise<ProductsResponse> {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    categories = [],
    statuses = [],
    priceMin,
    priceMax,
    sortBy: requestedSortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  try {
    // Validate sortBy parameter - only allow fields supported by the backend
    const allowedSortFields = ['name', 'price', 'createdAt'];
    const sortBy = allowedSortFields.includes(requestedSortBy) ? requestedSortBy : 'createdAt';
    
    if (sortBy !== requestedSortBy) {
      console.warn(`Requested sort field '${requestedSortBy}' is not supported. Using '${sortBy}' instead.`);
    }
    
    // Debug logging for input parameters
    console.log('[API] GET /api/products - Query params:', {
      page,
      pageSize,
      search,
      categories,
      statuses,
      priceMin,
      priceMax,
      sortBy,
      sortOrder
    });
    
    // Create a URL object with explicit string parameters
    const url = new URL(`${PRODUCT_SERVICE_URL}/api/v1/admin/products`);
    
    // Add parameters as strings
    url.searchParams.append('page', String(page));
    url.searchParams.append('limit', String(pageSize)); // Backend expects 'limit'
    
    // Add sort parameters
    if (sortBy && typeof sortBy === 'string') {
      console.log('Adding sort parameter:', sortBy);
      url.searchParams.append('sortBy', sortBy);
    } else {
      console.log('Adding default sort parameter: createdAt');
      url.searchParams.append('sortBy', 'createdAt');
    }
    
    // Always use uppercase sortOrder for backend
    const normalizedSortOrder = (sortOrder && typeof sortOrder === 'string')
      ? (sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC')
      : 'DESC';
    console.log('Adding sort order:', normalizedSortOrder);
    url.searchParams.append('sortOrder', normalizedSortOrder);
    
    // Add filtering parameters
    if (search && typeof search === 'string' && search.trim()) {
      console.log('Adding search parameter:', search.trim());
      url.searchParams.append('search', search.trim());
    }
    
    if (categories && Array.isArray(categories) && categories.length > 0) {
      // Handle both single and multiple category selections
      if (categories.length === 1) {
        console.log('Adding single category filter:', categories[0]);
        url.searchParams.append('categoryId', categories[0]);
      } else {
        console.log('Adding multiple categories filter:', categories);
        // Join all category IDs with commas for the backend
        url.searchParams.append('categoryIds', categories.join(','));
      }
    } else {
      console.log('No categories filter provided');
    }
    
    if (statuses && Array.isArray(statuses) && statuses.length > 0) {
      console.log('Adding statuses filter:', statuses);
      if (statuses.includes('in_stock')) {
        url.searchParams.append('isPublished', 'true');
      } else if (statuses.includes('out_of_stock')) {
        url.searchParams.append('isPublished', 'false');
      }
    } else {
      console.log('No statuses filter provided');
    }
    
    if (priceMin !== undefined && priceMin !== null) {
      url.searchParams.append('minPrice', String(priceMin));
    }
    
    if (priceMax !== undefined && priceMax !== null) {
      url.searchParams.append('maxPrice', String(priceMax));
    }
    
    // Get the auth token for the request
    const token = await getServerAuthToken();
    console.log('Making request with token:', token);
    console.log('Full request URL:', url.toString());
    console.log('Search params:', Object.fromEntries(url.searchParams.entries()));
    
    const response = await makeRequest(url.toString());
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Backend response received:', data);

    // Handle the new response format with data and meta properties
    if (data.data && Array.isArray(data.data) && data.meta) {
      const products = data.data.map(transformProduct);
      return {
        products,
        pagination: {
          total: data.meta.total,
          totalPages: data.meta.totalPages,
          currentPage: data.meta.page,
          pageSize: data.meta.limit,
          hasMore: data.meta.hasNextPage,
          hasPrevious: data.meta.hasPrevPage
        }
      };
    }

    // Fallback to legacy format handling
    let products: Product[] = [];
    if (Array.isArray(data)) {
      products = data.map(transformProduct);
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products.map(transformProduct);
    } else if (data.items && Array.isArray(data.items)) {
      products = data.items.map(transformProduct);
    }
    
    return {
      products,
      pagination: data.pagination || {
        total: products.length,
        totalPages: Math.ceil(products.length / pageSize),
        currentPage: page,
        pageSize: pageSize,
        hasMore: page * pageSize < products.length,
        hasPrevious: page > 1
      }
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}

export async function getProductById(id: string): Promise<Product> {
  try {
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${id}`;
    console.log(`Fetching product ${id}`);
    
    const response = await makeRequest(url);
    console.log('Response status:', response.status);
    
    const apiProduct: ApiProduct = await response.json();
    return transformProduct(apiProduct);
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
}

export async function createProduct(productData: Partial<ApiProduct>): Promise<Product> {
  try {
    console.log('Creating product with data:', productData);
    
    // Use the admin endpoint for creating products
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products`;
    console.log('Making request to:', url);
    console.log('URL details:', {
      href: url,
      origin: new URL(url).origin,
      pathname: new URL(url).pathname,
      search: new URL(url).search,
      searchParams: Object.fromEntries(new URL(url).searchParams.entries())
    });
    
    const response = await makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    
    console.log('Response status:', response.status);
    const apiProduct: ApiProduct = await response.json();
    console.log('Created product:', apiProduct);
    
    return transformProduct(apiProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(id: string, productData: Partial<ApiProduct>): Promise<Product> {
  try {
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${id}`;
    console.log(`Updating product ${id} with data:`, productData);
    
    const response = await makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    
    console.log('Response status:', response.status);
    const apiProduct: ApiProduct = await response.json();
    return transformProduct(apiProduct);
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${id}`;
    console.log(`Deleting product ${id}`);
    
    await makeRequest(url, {
      method: 'DELETE',
    });
    
    console.log(`Product ${id} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}

export async function updateProductStatus(id: string, status: string): Promise<void> {
  try {
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${id}/status`;
    console.log(`Updating product ${id} status to ${status}`);
    
    await makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    
    console.log(`Product ${id} status updated successfully`);
  } catch (error) {
    console.error(`Error updating product ${id} status:`, error);
    throw error;
  }
}

export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  try {
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/bulk-delete`;
    console.log(`Bulk deleting products: ${ids.join(', ')}`);
    
    await makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ productIds: ids }),
    });
    
    console.log('Products deleted successfully');
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    throw error;
  }
}

export async function bulkUpdateProductStatus(ids: string[], status: string): Promise<void> {
  try {
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/bulk-status`;
    console.log(`Bulk updating product status to ${status} for: ${ids.join(', ')}`);
    
    await makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({ productIds: ids, status }),
    });
    
    console.log('Product statuses updated successfully');
  } catch (error) {
    console.error('Error bulk updating product status:', error);
    throw error;
  }
}

export async function exportProducts(filters?: ProductQueryParams): Promise<Blob> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.categories?.length) queryParams.append('categories', filters.categories.join(','));
      if (filters.statuses?.length) queryParams.append('statuses', filters.statuses.join(','));
      if (filters.priceMin !== undefined) queryParams.append('priceMin', filters.priceMin.toString());
      if (filters.priceMax !== undefined) queryParams.append('priceMax', filters.priceMax.toString());
    }

    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/export?${queryParams}`;
    console.log('Exporting products with URL:', url);
    
    const response = await makeRequest(url, {
      headers: {
        Accept: 'application/vnd.ms-excel',
      },
    });
    
    console.log('Export response status:', response.status);
    return response.blob();
  } catch (error) {
    console.error('Error exporting products:', error);
    throw error;
  }
} 