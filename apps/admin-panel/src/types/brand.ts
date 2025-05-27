export interface Brand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: Array<{
    id: string;
    name: string;
  }>;
}

export interface BrandListingParams {
  page?: number;
  pageSize?: number;
  search?: string;
  statuses?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BrandListingResponse {
  brands: Brand[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

export interface CreateBrandData {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
}

export interface UpdateBrandData extends Partial<CreateBrandData> {} 