import {
  ShippingMethod,
  ShippingRate,
  ShippingZone,
  PaginationOptions as BasePaginationOptions,
  ShippingMethodFilters,
  ShippingZoneFilters,
  ShippingRateFilters,
  Region,
} from '@/types/shipping';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

interface PaginationOptions extends Partial<BasePaginationOptions> {
  page: number;
  limit: number;
}

const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?returnUrl=${returnUrl}`;
      throw new Error(error.message || 'Authentication failed');
    }
    throw new Error(error.message || `API error: ${response.status}`);
  }
  return response.json();
};

const buildQueryString = (filters: any, pagination: PaginationOptions): string => {
  const params = new URLSearchParams({
    page: pagination.page.toString(),
    limit: pagination.limit.toString(),
    ...(pagination.sortBy && { sortBy: pagination.sortBy }),
    ...(pagination.order && { order: pagination.order }),
  });

  for (const key in filters) {
    // Check if the property exists and is not undefined
    if (Object.prototype.hasOwnProperty.call(filters, key) && filters[key] !== undefined) {
      params.append(key, String(filters[key]));
    }
  }

  return params.toString();
};

interface Country {
  code: string;
  name: string;
}

// Add this interface for the API request format
interface ShippingZoneUpdateRequest {
  name?: string;
  code?: string;
  description?: string;
  countries?: string[];
  regions?: Region[];
  pincodePatterns?: string[];
  pincodeRanges?: string[];
  excludedPincodes?: string[];
  isActive?: boolean;
  priority?: number;
}

export const shippingApi = {
  // Shipping Methods
  listShippingMethods: async (
    filters: ShippingMethodFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<{ methods: ShippingMethod[]; pagination: any }> => {
    const query = buildQueryString(filters, pagination);
    const response = await fetch(`/api/shipping/methods?${query}`, { headers: getAuthHeaders(), credentials: 'include' });
    return handleResponse(response);
  },

  getShippingMethod: async (id: string): Promise<ShippingMethod> => {
    const response = await fetch(`/api/shipping/methods/${id}`, { headers: getAuthHeaders(), credentials: 'include' });
    return handleResponse(response);
  },

  createShippingMethod: async (data: Partial<ShippingMethod>): Promise<ShippingMethod> => {
    const response = await fetch('/api/shipping/methods', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  updateShippingMethod: async (id: string, data: Partial<ShippingMethod>): Promise<ShippingMethod> => {
    const response = await fetch(`/api/shipping/methods/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  deleteShippingMethod: async (id: string): Promise<void> => {
    const response = await fetch(`/api/shipping/methods/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleResponse(response);
  },

  // Shipping Zones
  listShippingZones: async (
    filters: ShippingZoneFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<{ zones: ShippingZone[]; pagination: any }> => {
    const query = buildQueryString(filters, pagination);
    const response = await fetch(`/api/shipping/zones?${query}`, { headers: getAuthHeaders(), credentials: 'include' });
    return handleResponse(response);
  },

  getShippingZone: async (id: string): Promise<ApiResponse<ShippingZone>> => {
    try {
      const response = await fetch(`/api/shipping/zones/${id}`, { 
        headers: getAuthHeaders(), 
        credentials: 'include' 
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON Response:', text);
        throw new Error('Response was not JSON');
      }

      const data = await response.json();
      
      // Transform the data to match our types
      if (data.data) {
        data.data = {
          ...data.data,
          // Ensure countries is an array of strings without curly braces
          countries: Array.isArray(data.data.countries) 
            ? data.data.countries.map((c: string) => c.replace(/[{}]/g, ''))
            : [data.data.countries].map((c: string) => c.replace(/[{}]/g, '')),
          // Transform pincode ranges from strings to objects
          pincodeRanges: (data.data.pincodeRanges || []).map((range: string) => {
            const [start, end] = range.split('-');
            return { start, end };
          }),
          // Ensure other arrays are not null
          excludedPincodes: data.data.excludedPincodes || [],
          pincodePatterns: data.data.pincodePatterns || [],
          regions: data.data.regions || []
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching shipping zone:', error);
      throw error;
    }
  },

  createShippingZone: async (data: Partial<ShippingZone>): Promise<ShippingZone> => {
    const response = await fetch('/api/shipping/zones', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  updateShippingZone: async (id: string, data: ShippingZoneUpdateRequest): Promise<ApiResponse<ShippingZone>> => {
    const response = await fetch(`/api/shipping/zones/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return handleResponse(response);
  },

  deleteShippingZone: async (id: string): Promise<void> => {
    const response = await fetch(`/api/shipping/zones/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleResponse(response);
  },

  // Shipping Rates
  listShippingRates: async (
    filters: ShippingRateFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<{ rates: ShippingRate[]; pagination: any }> => {
    const query = buildQueryString(filters, pagination);
    const response = await fetch(`/api/shipping/rates?${query}`, { headers: getAuthHeaders(), credentials: 'include' });
    return handleResponse(response);
  },

  getShippingRate: async (id: string): Promise<ShippingRate> => {
    const response = await fetch(`/api/shipping/rates/${id}`, { headers: getAuthHeaders(), credentials: 'include' });
    return handleResponse(response);
  },

  createShippingRate: async (data: Partial<ShippingRate>): Promise<ShippingRate> => {
    const response = await fetch('/api/shipping/rates', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  updateShippingRate: async (id: string, data: Partial<ShippingRate>): Promise<ShippingRate> => {
    const response = await fetch(`/api/shipping/rates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  deleteShippingRate: async (id: string): Promise<void> => {
    const response = await fetch(`/api/shipping/rates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleResponse(response);
  },

  async getAvailableCountries(): Promise<Country[]> {
    const response = await fetch('/api/shipping/countries');
    if (!response.ok) {
      throw new Error('Failed to fetch available countries');
    }
    return response.json();
  },
}; 