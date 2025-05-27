'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  Plus, 
  Download,
  Trash2, 
  Pencil,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import Table from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { TableInstance } from '@/components/Table';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, type FilterState, type FilterConfig } from '@/components/ui/CommonFilters';
import type { Category, CategoryListingResponse } from '@/types/category';

const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search categories by name...',
  },
  status: {
    type: 'select',
    placeholder: 'Filter by status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  parentId: {
    type: 'select',
    placeholder: 'Filter by parent category',
    options: [], // This will be populated dynamically
  },
};

const initialFilters: FilterState = {
  search: '',
  status: [],
  parentId: '',
};

const fetcher = async (url: string) => {
  try {
    console.log('Fetching categories from:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => {
        console.error('Failed to parse error response as JSON');
        return {};
      });
      console.error('Error response:', error);
      
      if (response.status === 401) {
        console.log('Unauthorized access, redirecting to login');
        window.location.href = '/login';
        return;
      }
      throw new Error(error.message || 'Failed to fetch categories');
    }
    
    const data = await response.json();
    console.log('Successfully fetched categories data:', data);
    return data;
  } catch (error) {
    console.error('Error in fetcher:', error);
    throw error;
  }
};

export default function CategoriesPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Add debouncing for filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
    setSelectedCategories([]);
  }, []);

  const getApiUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder,
    });

    if (debouncedFilters.search) {
      const searchTerm = (debouncedFilters.search as string).trim();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
    }
    
    if ((debouncedFilters.status as string[])?.length) {
      params.append('status', (debouncedFilters.status as string[]).join(','));
    }

    if (debouncedFilters.parentId) {
      params.append('parentId', debouncedFilters.parentId as string);
    }

    return `/api/categories?${params.toString()}`;
  }, [page, pageSize, debouncedFilters, sortBy, sortOrder]);

  const { data, error, isLoading, mutate } = useSWR<CategoryListingResponse>(
    getApiUrl(),
    fetcher,
    {
      onError: (err) => {
        console.error('Error fetching categories:', err);
        toast.error('Failed to load categories');
      }
    }
  );

  // Fetch parent categories for filter
  const { data: parentCategories } = useSWR<CategoryListingResponse>(
    '/api/categories?pageSize=100&parentId=null',
    fetcher,
    {
      onError: (err) => {
        console.error('Error fetching parent categories:', err);
        toast.error('Failed to load parent categories');
      }
    }
  );

  // Update filter config with parent categories
  useEffect(() => {
    if (parentCategories?.categories) {
      filterConfig.parentId.options = [
        { value: '', label: 'All Categories' },
        ...parentCategories.categories.map((cat: Category) => ({
          value: cat.id,
          label: cat.name,
        })),
      ];
    }
  }, [parentCategories]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleApiOperation = async (operation: () => Promise<Response>, successMessage: string) => {
    try {
      setIsLoadingOperation(true);
      const response = await operation();
      if (!response.ok) throw new Error(`Failed to ${successMessage.toLowerCase()}`);
      
      toast.success(successMessage);
      mutate();
      return true;
    } catch (error) {
      console.error(`Error: ${successMessage.toLowerCase()}:`, error);
      toast.error(`Failed to ${successMessage.toLowerCase()}`);
      return false;
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    const success = await handleApiOperation(
      () => fetch(`/api/categories/${categoryId}`, { method: 'DELETE' }),
      'Category deleted successfully'
    );
    
    if (success) {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCategories.length} categories?`)) return;
    
    const success = await handleApiOperation(
      () => fetch('/api/categories/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: selectedCategories }),
      }),
      `${selectedCategories.length} categories deleted successfully`
    );
    
    if (success) {
      setSelectedCategories([]);
    }
  };

  const handleExport = () => 
    handleApiOperation(
      async () => {
        const response = await fetch('/api/categories/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryIds: selectedCategories.length ? selectedCategories : 'all' }),
        });
        
        if (!response.ok) throw new Error('Failed to export categories');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'categories.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return response;
      },
      'Categories exported successfully'
    );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedCategories([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedCategories([]);
  };

  const columns = [
    {
      header: ({ table }: { table: TableInstance }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row, table }: { row: Category; table: TableInstance & { getRowProps: (row: Category) => { getIsSelected: () => boolean; getToggleSelectedHandler: () => () => void } } }) => {
        const rowProps = table.getRowProps(row);
        return (
          <input
            type="checkbox"
            checked={rowProps.getIsSelected()}
            onChange={rowProps.getToggleSelectedHandler()}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        );
      },
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('name')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Category Name
          <span className="inline-flex">
            {sortBy === 'name' ? (
              sortOrder === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </button>
      ),
      cell: ({ row }: { row: Category }) => (
        <div className="font-medium">{row.name}</div>
      ),
    },
    {
      header: 'Parent Category',
      cell: ({ row }: { row: Category }) => (
        row.parentId ? (
          <span className="text-gray-600">
            {parentCategories?.categories.find(c => c.id === row.parentId)?.name || '-'}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('isActive')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Status
          <span className="inline-flex">
            {sortBy === 'isActive' ? (
              sortOrder === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </button>
      ),
      cell: ({ row }: { row: Category }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.isActive
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('createdAt')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Created At
          <span className="inline-flex">
            {sortBy === 'createdAt' ? (
              sortOrder === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </button>
      ),
      cell: ({ row }: { row: Category }) => {
        // Log the createdAt value for debugging
        if (typeof row.createdAt === 'object' && row.createdAt !== null) {
          console.log('Category createdAt object:', row.createdAt);
        }
        return (
          <span className="text-sm text-gray-500">
            {formatDate(row.createdAt)}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: Category }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/products/categories/${row.id}/edit`)}
            disabled={isLoadingOperation}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.id)}
            disabled={isLoadingOperation}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    console.error('Rendering error state:', error);
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600 font-medium">Failed to load categories</p>
        <p className="text-red-500 text-sm mt-1">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => {
            console.log('Retrying categories fetch...');
            mutate();
          }}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isLoadingOperation}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push('/products/categories/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CommonFilters
        config={filterConfig}
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {/* Bulk Actions */}
      {selectedCategories.length > 0 && (
        <div className="flex items-center gap-4 py-4">
          <span className="text-sm text-gray-600">
            {selectedCategories.length} items selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoadingOperation}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          data={data?.categories ?? []}
          columns={columns}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedCategories,
            onSelectedRowsChange: setSelectedCategories,
          }}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {data?.pagination?.total ? (page - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {data?.pagination?.total
                  ? Math.min(page * pageSize, data.pagination.total)
                  : 0}
              </span>{' '}
              of{' '}
              <span className="font-medium">{data?.pagination?.total || 0}</span>{' '}
              results
            </p>

            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={data?.pagination?.total || 0}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
} 