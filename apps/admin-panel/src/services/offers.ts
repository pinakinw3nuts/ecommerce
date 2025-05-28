import { API_BASE_URL, PRODUCT_SERVICE_URL } from '@/lib/constants';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  startDate: string;
  endDate: string;
  isActive: boolean;
  minimumPurchaseAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  isFirstPurchaseOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponDto {
  code: string;
  name: string;
  description?: string;
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  startDate: string;
  endDate: string;
  minimumPurchaseAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  isFirstPurchaseOnly?: boolean;
}

export interface UpdateCouponDto extends Partial<CreateCouponDto> {
  isActive?: boolean;
}

export interface CouponListParams {
  skip?: number;
  take?: number;
  isActive?: boolean;
  includeExpired?: boolean;
}

export const offerService = {
  async listCoupons(params: CouponListParams = {}): Promise<Coupon[]> {
    const queryParams = new URLSearchParams();
    
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params.take !== undefined) queryParams.append('take', params.take.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.includeExpired !== undefined) queryParams.append('includeExpired', params.includeExpired.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `${PRODUCT_SERVICE_URL}/api/v1/coupons/${queryString}`;
    
    console.log('Fetching coupons from API:', url);
    console.log('PRODUCT_SERVICE_URL:', PRODUCT_SERVICE_URL);
    
    try {
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to fetch coupons: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Successfully fetched coupons, count:', Array.isArray(data) ? data.length : 'Not an array');
      return data;
    } catch (error) {
      console.error('Error in listCoupons:', error);
      throw error;
    }
  },
  
  async getCouponById(id: string): Promise<Coupon> {
    const url = `${PRODUCT_SERVICE_URL}/api/v1/coupons/${id}`;
    console.log('Fetching coupon by ID:', url);
    
    try {
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
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
    const url = `${PRODUCT_SERVICE_URL}/api/v1/coupons/`;
    console.log('Creating coupon:', url, couponData);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(couponData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
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
    const url = `${PRODUCT_SERVICE_URL}/api/v1/coupons/${id}`;
    console.log('Updating coupon:', url, couponData);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(couponData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
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
    const url = `${PRODUCT_SERVICE_URL}/api/v1/coupons/${id}`;
    console.log('Deleting coupon:', url);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
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
  }
}; 