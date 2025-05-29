// Remove the import of cookies from next/headers
// import { cookies } from 'next/headers';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

export interface AttributeValue {
  id?: string;
  value: string;
  displayValue?: string;
  metadata?: {
    hexColor?: string;
    imageUrl?: string;
    sortOrder?: number;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attribute {
  id: string;
  name: string;
  description?: string;
  type: 'select' | 'multiple' | 'text' | 'number' | 'boolean';
  isFilterable: boolean;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  values?: AttributeValue[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export interface AttributesResponse {
  attributes: Attribute[];
  pagination: PaginationInfo;
}

export interface AttributeQueryParams {
  [key: string]: any;
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string[];
  isFilterable?: string[];
  isRequired?: string[];
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

// Modified server-side function to avoid using next/headers
async function getServerAuthToken() {
  // In a client component, we can't use server-side methods
  // Return null or use an alternative approach
  return null;
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

function buildQueryString(params: AttributeQueryParams): string {
  const queryParams = new URLSearchParams();
  
  if (params.page) {
    queryParams.append('page', params.page.toString());
  }
  
  if (params.pageSize) {
    queryParams.append('pageSize', params.pageSize.toString());
  }
  
  if (params.search) {
    queryParams.append('search', params.search);
  }
  
  if (params.sortBy) {
    queryParams.append('sortBy', params.sortBy);
  }
  
  if (params.sortOrder) {
    queryParams.append('sortOrder', params.sortOrder.toUpperCase());
  }
  
  // Process array parameters
  Object.entries(params).forEach(([key, value]) => {
    // Skip already processed parameters
    if (['page', 'pageSize', 'search', 'sortBy', 'sortOrder'].includes(key)) {
      return;
    }
    
    // Handle arrays
    if (Array.isArray(value) && value.length > 0) {
      value.forEach(item => {
        queryParams.append(key, item);
      });
    }
  });
  
  return queryParams.toString();
}

export async function getAttributes(params: AttributeQueryParams = {}): Promise<AttributesResponse> {
  const queryString = buildQueryString(params);
  const url = `/api/products/attributes${queryString ? `?${queryString}` : ''}`;
  
  try {
    console.log(`Fetching attributes with URL: ${url}`);
    const response = await makeRequest(url);
    const data = await response.json();
    console.log('Attributes response data:', data);
    
    // Handle the case where the API returns an array instead of the expected object format
    if (Array.isArray(data)) {
      console.log('Transforming array response to expected format');
      return {
        attributes: data,
        pagination: {
          total: data.length,
          totalPages: 1,
          currentPage: 1,
          pageSize: data.length,
          hasMore: false,
          hasPrevious: false
        }
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching attributes:', error);
    throw error;
  }
}

export async function getAttributeById(id: string): Promise<Attribute> {
  try {
    const response = await makeRequest(`/api/products/attributes/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching attribute ${id}:`, error);
    throw error;
  }
}

export async function createAttribute(attributeData: Partial<Attribute>): Promise<Attribute> {
  try {
    console.log('Creating attribute with data:', attributeData);
    const response = await makeRequest('/api/products/attributes', {
      method: 'POST',
      body: JSON.stringify(attributeData),
    });
    console.log('Create attribute response status:', response.status);
    const data = await response.json();
    console.log('Create attribute response data:', data);
    return data;
  } catch (error) {
    console.error('Error creating attribute:', error);
    throw error;
  }
}

export async function updateAttribute(id: string, attributeData: Partial<Attribute>): Promise<Attribute> {
  try {
    console.log(`Updating attribute ${id} with data:`, attributeData);
    
    // Ensure boolean fields are explicitly set
    const formattedData = {
      ...attributeData,
      isActive: attributeData.isActive === undefined ? undefined : Boolean(attributeData.isActive),
      isFilterable: attributeData.isFilterable === undefined ? undefined : Boolean(attributeData.isFilterable),
      isRequired: attributeData.isRequired === undefined ? undefined : Boolean(attributeData.isRequired)
    };
    
    console.log(`Sending formatted data:`, formattedData);
    
    const response = await makeRequest(`/api/products/attributes/${id}`, {
      method: 'PUT', // Use PUT since the backend doesn't support PATCH
      body: JSON.stringify(formattedData),
    });
    
    const data = await response.json();
    console.log(`Update attribute response:`, data);
    return data;
  } catch (error) {
    console.error(`Error updating attribute ${id}:`, error);
    throw error;
  }
}

export async function deleteAttribute(id: string): Promise<Response> {
  try {
    return await makeRequest(`/api/products/attributes/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error deleting attribute ${id}:`, error);
    throw error;
  }
}

export async function bulkDeleteAttributes(ids: string[]): Promise<Response> {
  try {
    return await makeRequest('/api/products/attributes/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  } catch (error) {
    console.error('Error bulk deleting attributes:', error);
    throw error;
  }
}

export async function addAttributeValue(attributeId: string, valueData: Partial<AttributeValue>): Promise<AttributeValue> {
  try {
    const response = await makeRequest(`/api/products/attributes/${attributeId}/values`, {
      method: 'POST',
      body: JSON.stringify(valueData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error adding value to attribute ${attributeId}:`, error);
    throw error;
  }
}

export async function updateAttributeValue(valueId: string, valueData: Partial<AttributeValue>): Promise<AttributeValue> {
  try {
    const response = await makeRequest(`/api/products/attributes/values/${valueId}`, {
      method: 'PUT',
      body: JSON.stringify(valueData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error updating attribute value ${valueId}:`, error);
    throw error;
  }
}

export async function deleteAttributeValue(valueId: string): Promise<Response> {
  try {
    return await makeRequest(`/api/products/attributes/values/${valueId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error deleting attribute value ${valueId}:`, error);
    throw error;
  }
}

export async function assignAttributesToProduct(
  productId: string, 
  attributeValueIds: string[]
): Promise<any> {
  try {
    const response = await makeRequest(`/api/products/attributes/products/${productId}/attributes`, {
      method: 'POST',
      body: JSON.stringify({ attributeValues: attributeValueIds }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error assigning attributes to product ${productId}:`, error);
    throw error;
  }
}

export async function updateAttributeStatus(id: string, isActive: boolean): Promise<Attribute> {
  try {
    console.log(`Updating attribute ${id} status to isActive=${isActive}`);
    
    // Create a payload with only the isActive field
    const payload = {
      isActive: Boolean(isActive)
    };
    
    console.log(`Sending status update payload:`, payload);
    
    const response = await makeRequest(`/api/products/attributes/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    console.log(`Update status response:`, data);
    
    // Verify the status was updated correctly
    if (data.isActive !== isActive) {
      console.warn(`Warning: Status update may not have been applied correctly. Expected isActive=${isActive}, got isActive=${data.isActive}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error updating attribute status ${id}:`, error);
    throw error;
  }
} 