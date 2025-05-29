import { CouponListParams, CouponListingResponse, Coupon, CreateCouponData, UpdateCouponData } from '../types/coupon';

// Helper function to get auth headers
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    
    // Handle auth errors
    if (response.status === 401) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?returnUrl=${returnUrl}`;
      throw new Error(error.message || 'Authentication failed');
    }
    
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  return response.json();
};

export const offerApi = {
  // List coupons with filtering
  listCoupons: async (params: CouponListParams): Promise<CouponListingResponse> => {
    const queryParams = new URLSearchParams();
    
    // Add all params to query string
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.statuses?.length) queryParams.append('status', params.statuses.join(','));
    if (params.types?.length) queryParams.append('type', params.types.join(','));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.minValue) queryParams.append('minValue', params.minValue.toString());
    if (params.maxValue) queryParams.append('maxValue', params.maxValue.toString());
    if (params.skip) queryParams.append('skip', params.skip.toString());
    if (params.take) queryParams.append('take', params.take.toString());
    
    try {
      const response = await fetch(`/api/coupons?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return {
        coupons: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: params.page || 1,
          pageSize: params.pageSize || 10,
          hasMore: false,
          hasPrevious: false
        }
      };
    }
  },

  // Get coupon by ID
  getCouponById: async (id: string): Promise<Coupon> => {
    const response = await fetch(`/api/coupons/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create new coupon
  createCoupon: async (data: CreateCouponData): Promise<Coupon> => {
    const response = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // Update coupon
  updateCoupon: async (id: string, data: UpdateCouponData): Promise<Coupon> => {
    const response = await fetch(`/api/admin/coupons/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // Delete coupon
  deleteCoupon: async (id: string): Promise<void> => {
    const response = await fetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(response);
  },

  // Bulk delete coupons
  bulkDeleteCoupons: async (ids: string[]): Promise<void> => {
    const response = await fetch('/api/admin/coupons/bulk-delete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ couponIds: ids })
    });
    await handleResponse(response);
  },
  
  // Bulk deactivate coupons
  bulkDeactivateCoupons: async (ids: string[]): Promise<void> => {
    const response = await fetch('/api/admin/coupons/bulk-update', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        couponIds: ids,
        updates: { isActive: false }
      })
    });
    await handleResponse(response);
  }
}; 