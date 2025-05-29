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

export interface CouponListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  statuses?: string[];
  types?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  minValue?: number;
  maxValue?: number;
  skip?: number;
  take?: number;
}

export interface CouponListingResponse {
  coupons: Coupon[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

export interface CreateCouponData {
  code: string;
  name: string;
  description?: string;
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  startDate: string;
  endDate: string;
  isActive?: boolean;
  minimumPurchaseAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  isFirstPurchaseOnly?: boolean;
}

export interface UpdateCouponData extends Partial<CreateCouponData> {} 