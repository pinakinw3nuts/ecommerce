import { Coupon, CouponListParams, CouponListingResponse, CreateCouponData as CreateCouponDto, UpdateCouponData as UpdateCouponDto } from '@/types/coupon';

// Helper function to get auth headers
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// Extended params interface for internal use
interface ExtendedCouponListParams extends CouponListParams {
  isActive?: boolean;
  includeExpired?: boolean;
}

export const offerService = {
  async listCoupons(params: ExtendedCouponListParams = {}): Promise<CouponListingResponse> {
    const queryParams = new URLSearchParams();
    
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
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.includeExpired !== undefined) queryParams.append('includeExpired', params.includeExpired.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `/api/coupons${queryString}`;
    
    try {
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to fetch coupons: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in listCoupons:', error);
      throw error;
    }
  },
  
  async getCouponById(id: string): Promise<Coupon> {
    const url = `/api/coupons/${id}`;
    
    try {
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to fetch coupon: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getCouponById:', error);
      throw error;
    }
  },
  
  async createCoupon(couponData: CreateCouponDto): Promise<Coupon> {
    const url = `/api/admin/coupons`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(couponData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to create coupon: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in createCoupon:', error);
      throw error;
    }
  },
  
  async updateCoupon(id: string, couponData: UpdateCouponDto): Promise<Coupon> {
    const url = `/api/admin/coupons/${id}`;
    
    // Ensure isActive is explicitly included in the request
    const dataToSend = {
      ...couponData,
      isActive: couponData.isActive !== undefined ? Boolean(couponData.isActive) : undefined
    };
    
    console.log('Service sending update with isActive:', dataToSend.isActive);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to update coupon: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in updateCoupon:', error);
      throw error;
    }
  },
  
  async deleteCoupon(id: string): Promise<void> {
    const url = `/api/admin/coupons/${id}`;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to delete coupon: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in deleteCoupon:', error);
      throw error;
    }
  },
  
  async bulkDeleteCoupons(ids: string[]): Promise<void> {
    const url = `/api/admin/coupons/bulk-delete`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ couponIds: ids }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to bulk delete coupons: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in bulkDeleteCoupons:', error);
      throw error;
    }
  },
  
  async bulkUpdateCoupons(ids: string[], updates: { isActive: boolean }): Promise<void> {
    const url = `/api/admin/coupons/bulk-update`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          couponIds: ids,
          updates,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to bulk update coupons: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in bulkUpdateCoupons:', error);
      throw error;
    }
  },
}; 