export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  products?: Array<{
    id: string;
    name: string;
  }>;
  children?: Category[];
  parent?: Category;
}

export interface CategoryListingParams {
  page?: number;
  pageSize?: number;
  search?: string;
  statuses?: string[];
  parentId?: string | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryListingResponse {
  categories: Category[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {} 