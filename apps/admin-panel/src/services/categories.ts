import { Category } from '@/lib/mock/categories';

export interface CategoriesResponse {
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

export interface CategoryFilters {
  search?: string;
  status?: string[];
  parentId?: string | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export async function getCategories(filters: CategoryFilters = {}): Promise<CategoriesResponse> {
  const params = new URLSearchParams();

  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.status?.length) {
    params.append('status', filters.status.join(','));
  }
  if (filters.parentId !== undefined) {
    params.append('parentId', filters.parentId?.toString() || '');
  }
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  if (filters.sortOrder) {
    params.append('sortOrder', filters.sortOrder);
  }
  if (filters.page) {
    params.append('page', filters.page.toString());
  }
  if (filters.pageSize) {
    params.append('pageSize', filters.pageSize.toString());
  }

  const response = await fetch(`/api/categories?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}

export async function getCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch category');
  }

  return response.json();
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create category');
  }

  return response.json();
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update category');
  }

  return response.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
}

export async function bulkDeleteCategories(categoryIds: string[]): Promise<{ deletedCount: number }> {
  const response = await fetch('/api/categories/bulk-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ categoryIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete categories');
  }

  return response.json();
}

export async function exportCategories(categoryIds: string[] | 'all'): Promise<Blob> {
  const response = await fetch('/api/categories/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ categoryIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to export categories');
  }

  return response.blob();
} 