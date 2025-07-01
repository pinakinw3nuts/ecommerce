import apiClient from '../lib/api';
import { 
  Payment, 
  PaymentMethod, 
  PaymentStatus,
  PaymentMethodStatus,
  Refund,
  PaymentGateway,
  PaymentGatewaysResponse
} from '../types/payment';

const BASE_URL = '/api/payments';

export interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PaymentsResponse {
  items: Payment[];
  pagination: PaginationInfo;
}

export interface PaymentMethodsResponse {
  items: PaymentMethod[];
  pagination: PaginationInfo;
}

export interface PaymentListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  orderId?: string;
  status?: string[] | string;
  userId?: string;
  provider?: string[] | string;
  fromDate?: string;
  toDate?: string;
  minAmount?: string;
  maxAmount?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentMethodListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string[] | string;
  provider?: string[] | string;
  type?: string[] | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentGatewayListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  enabled?: boolean;
  type?: string[] | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RefundPaymentParams {
  paymentId: string;
  amount: number;
  reason: string;
}

export interface CreatePaymentGatewayParams {
  name: string;
  code: string;
  type: string;
  description: string;
  logo?: string | null;
  isEnabled: boolean;
  supportedCurrencies: string[];
  minimumAmount?: number | null;
  maximumAmount?: number | null;
  countries?: string[] | null;
  excludedCountries?: string[] | null;
  paymentInstructions?: string | null;
  transactionFee?: number | null;
  transactionFeeType?: 'fixed' | 'percentage' | null;
  processingTime?: string | null;
  settings: Record<string, any>;
}

export interface UpdatePaymentGatewayParams extends Partial<CreatePaymentGatewayParams> {
  id: string;
}

function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        // For arrays, join with commas
        queryParams.append(key, value.join(','));
      }
    } else if (typeof value === 'object' && value !== null) {
      // Skip objects unless they have a specific handling
      return;
    } else {
      // Convert all other values to strings
      queryParams.append(key, String(value));
    }
  });
  
  return queryParams.toString();
}

/**
 * Payment Management Service
 */
export const PaymentService = {
  /**
   * Get all payments with optional filters
   */
  async getPayments(params: PaymentListParams = {}): Promise<PaymentsResponse> {
    console.log('PaymentService.getPayments called with params:', params);
    
    // Track last request time to avoid rate limiting
    const now = Date.now();
    const lastRequestTime = (this as any)._lastRequestTime || 0;
    const timeSinceLastRequest = now - lastRequestTime;
    
    // If less than 2 seconds since last request, add delay
    if (lastRequestTime > 0 && timeSinceLastRequest < 2000) {
      console.log(`Rate limiting: Waiting ${2000 - timeSinceLastRequest}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, 2000 - timeSinceLastRequest));
    }
    
    // Update last request time
    (this as any)._lastRequestTime = Date.now();
    
    const maxRetries = 1; // Reduce retries to avoid rate limiting
    let retries = 0;
    
    try {
      // Validate sort parameters
      const validSortColumns = [
        'id', 'orderId', 'userId', 'provider', 'status', 
        'amount', 'currency', 'createdAt', 'updatedAt'
      ];
      
      // If sortBy is not valid, default to createdAt
      if (params.sortBy && !validSortColumns.includes(params.sortBy)) {
        console.warn(`Invalid sortBy parameter: ${params.sortBy}. Defaulting to createdAt.`);
        params.sortBy = 'createdAt';
      }
      
      const queryString = buildQueryString(params);
      const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
      console.log('Requesting payments from URL:', url);
      
      const response = await apiClient.get(url);
      console.log('Payment API response received:', {
        hasItems: Array.isArray((response as any)?.items),
        itemCount: Array.isArray((response as any)?.items) ? (response as any).items.length : 0,
        pagination: (response as any)?.pagination
      });
      
      return response as unknown as PaymentsResponse;
    } catch (error: any) {
      console.error('Payment API request failed:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      
      // Handle rate limiting specifically
      if (error?.response?.status === 429) {
        const retryAfter = error?.response?.headers?.['retry-after'] || 60;
        console.warn(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
        throw new Error(`Rate limit exceeded. Please try again later.`);
      }
      
      // Handle invalid filter values
      if (error?.response?.status === 400 && error?.response?.data?.error?.details?.includes('filter values')) {
        throw new Error(`Invalid filter value: ${error?.response?.data?.error?.originalError || 'Please check your filters'}`);
      }
      
      // For other errors, retry once
      if (retries < maxRetries) {
        retries++;
        console.warn(`API call failed, retrying (${retries}/${maxRetries})...`);
        // Exponential backoff: 2000ms
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.getPayments(params);
      }
      
      throw error;
    }
  },

  /**
   * Get a single payment by ID
   */
  async getPaymentById(id: string): Promise<Payment> {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response as unknown as Payment;
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment> {
    const response = await apiClient.put(`${BASE_URL}/${id}/status`, { status });
    return response as unknown as Payment;
  },

  /**
   * Process a refund
   */
  async refundPayment(params: RefundPaymentParams): Promise<Refund> {
    const response = await apiClient.post(`${BASE_URL}/${params.paymentId}/refunds`, {
      amount: params.amount,
      reason: params.reason
    });
    return response as unknown as Refund;
  },

  /**
   * Delete a payment (for admin purposes only)
   */
  async deletePayment(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Bulk delete payments
   */
  async bulkDeletePayments(ids: string[]): Promise<void> {
    await apiClient.post(`${BASE_URL}/bulk-delete`, { ids });
  },

  async exportPayments(params: PaymentListParams = {}): Promise<Blob> {
    const queryString = buildQueryString(params);
    const url = `${BASE_URL}/export${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'text/csv' },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to export payments');
    }
    
    return response.blob();
  },

  /**
   * Get payment methods with optional filters
   */
  async getPaymentMethods(params: PaymentMethodListParams = {}): Promise<PaymentMethodsResponse> {
    const maxRetries = 2;
    let retries = 0;
    let lastError: any = null;
    
    while (retries <= maxRetries) {
      try {
        const queryString = buildQueryString(params);
        const url = `${BASE_URL}/methods${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get(url) as unknown;
        
        // Type guard to validate response structure
        const isValidResponse = (data: any): data is PaymentMethodsResponse => {
          return (
            data &&
            typeof data === 'object' &&
            Array.isArray(data.items) &&
            typeof data.pagination === 'object' &&
            typeof data.pagination.total === 'number' &&
            typeof data.pagination.currentPage === 'number' &&
            typeof data.pagination.pageSize === 'number' &&
            typeof data.pagination.totalPages === 'number'
          );
        };
        
        if (!isValidResponse(response)) {
          throw new Error('Invalid response structure from API');
        }
        
        return response;
      } catch (error: any) {
        lastError = error;
        retries++;
        
        // Log detailed error information
        console.error('API call failed:', {
          attempt: retries,
          maxRetries,
          error: error?.response?.data || error?.message || error,
          status: error?.response?.status,
        });
        
        if (retries > maxRetries) {
          console.error('Max retries reached for getPaymentMethods, giving up:', {
            error: lastError?.response?.data || lastError?.message || lastError,
            status: lastError?.response?.status,
          });
          throw new Error(
            lastError?.response?.data?.message || 
            lastError?.message || 
            'Failed to fetch payment methods'
          );
        }
        
        // Only retry on network errors or 5xx errors
        if (error?.response?.status && error.response.status < 500) {
          throw error;
        }
        
        console.warn(`API call failed, retrying (${retries}/${maxRetries})...`);
        // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries-1)));
      }
    }
    
    throw lastError || new Error('Failed to fetch payment methods after multiple retries');
  },

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/methods/${id}`);
  },

  /**
   * Bulk delete payment methods
   */
  async bulkDeletePaymentMethods(ids: string[]): Promise<void> {
    await apiClient.post(`${BASE_URL}/methods/bulk-delete`, { ids });
  },

  /**
   * Set a payment method as default
   */
  async setPaymentMethodDefault(id: string): Promise<void> {
    await apiClient.put(`${BASE_URL}/methods/${id}/default`);
  },

  /**
   * Update payment method status
   */
  async updatePaymentMethodStatus(id: string, status: PaymentMethodStatus): Promise<void> {
    await apiClient.put(`${BASE_URL}/methods/${id}/status`, { status });
  },

  /**
   * Get payment gateways with optional filters
   */
  async getPaymentGateways(params: PaymentGatewayListParams = {}): Promise<PaymentGatewaysResponse> {
    const maxRetries = 2;
    let retries = 0;
    let lastError: any = null;
    
    while (retries <= maxRetries) {
      try {
        const queryString = buildQueryString(params);
        const url = `${BASE_URL}/methods/gateways${queryString ? `?${queryString}` : ''}`;
        
        console.log('Requesting payment gateways from URL:', url);
        
        const response = await apiClient.get(url) as unknown;
        
        // Type guard to validate response structure
        const isValidResponse = (data: any): data is PaymentGatewaysResponse => {
          return (
            data &&
            typeof data === 'object' &&
            Array.isArray(data.items) &&
            typeof data.pagination === 'object' &&
            typeof data.pagination.total === 'number' &&
            typeof data.pagination.currentPage === 'number' &&
            typeof data.pagination.pageSize === 'number' &&
            typeof data.pagination.totalPages === 'number'
          );
        };
        
        if (!isValidResponse(response)) {
          throw new Error('Invalid response structure from API');
        }
        
        return response;
      } catch (error: any) {
        lastError = error;
        retries++;
        
        // Log detailed error information
        console.error('API call failed:', {
          attempt: retries,
          maxRetries,
          error: error?.response?.data || error?.message || error,
          status: error?.response?.status,
        });
        
        if (retries > maxRetries) {
          console.error('Max retries reached for getPaymentGateways, giving up:', {
            error: lastError?.response?.data || lastError?.message || lastError,
            status: lastError?.response?.status,
          });
          throw new Error(
            lastError?.response?.data?.message || 
            lastError?.message || 
            'Failed to fetch payment gateways'
          );
        }
        
        // Only retry on network errors or 5xx errors
        if (error?.response?.status && error.response.status < 500) {
          throw error;
        }
        
        console.warn(`API call failed, retrying (${retries}/${maxRetries})...`);
        // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries-1)));
      }
    }
    
    throw lastError || new Error('Failed to fetch payment gateways after multiple retries');
  },

  /**
   * Get a single payment gateway by ID
   */
  async getPaymentGatewayById(id: string): Promise<PaymentGateway> {
    try {
      const response = await apiClient.get(`${BASE_URL}/methods/gateways/${id}`);
      return response as unknown as PaymentGateway;
    } catch (error: any) {
      console.error('Payment Gateway API request failed:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        // Redirect to login page
        window.location.href = '/login';
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
  },

  /**
   * Create a new payment gateway
   */
  async createPaymentGateway(data: CreatePaymentGatewayParams): Promise<PaymentGateway> {
    try {
      const response = await apiClient.post(`${BASE_URL}/methods/gateways`, data);
      return response as unknown as PaymentGateway;
    } catch (error: any) {
      console.error('Payment Gateway API request failed:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        // Redirect to login page
        window.location.href = '/login';
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
  },

  /**
   * Update an existing payment gateway
   */
  async updatePaymentGateway(data: UpdatePaymentGatewayParams): Promise<PaymentGateway> {
    try {
      const response = await apiClient.put(`${BASE_URL}/methods/gateways/${data.id}`, data);
      return response as unknown as PaymentGateway;
    } catch (error: any) {
      console.error('Payment Gateway API request failed:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        // Redirect to login page
        window.location.href = '/login';
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
  },

  /**
   * Delete a payment gateway
   */
  async deletePaymentGateway(id: string): Promise<void> {
    try {
      await apiClient.delete(`${BASE_URL}/methods/gateways/${id}`);
    } catch (error: any) {
      console.error('Payment Gateway API request failed:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        // Redirect to login page
        window.location.href = '/login';
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
  },

  /**
   * Toggle payment gateway enabled status
   */
  async togglePaymentGatewayStatus(id: string, isEnabled: boolean): Promise<void> {
    try {
      await apiClient.put(`${BASE_URL}/methods/gateways/${id}/toggle-status`, { isEnabled });
    } catch (error: any) {
      console.error('Payment Gateway API request failed:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        // Redirect to login page
        window.location.href = '/login';
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
  },

  /**
   * Reorder payment gateways
   */
  async reorderPaymentGateways(gatewayIds: string[]): Promise<void> {
    try {
      await apiClient.put(`${BASE_URL}/methods/gateways/reorder`, { gatewayIds });
    } catch (error: any) {
      console.error('Payment Gateway API request failed:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        // Redirect to login page
        window.location.href = '/login';
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
  }
}