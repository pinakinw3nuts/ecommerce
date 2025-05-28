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

interface Brand {
  id: string;
  name: string;
  website?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: Array<{
    id: string;
    name: string;
  }>;
}

interface BrandsResponse {
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

const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search brands by name...',
  },
  status: {
    type: 'boolean',
    placeholder: 'Filter by status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
};

const initialFilters: FilterState = {
  search: '',
  status: [],
};

const fetcher = async (url: string) => {
  try {
    console.log('Fetching brands from:', url);
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
      throw new Error(error.message || 'Failed to fetch brands');
    }
    
    const data = await response.json();
    console.log('Successfully fetched brands data:', data);
    return data;
  } catch (error) {
    console.error('Error in fetcher:', error);
    throw error;
  }
};

export default function BrandsPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
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
    setSelectedBrands([]);
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

    return `/api/brands?${params.toString()}`;
  }, [page, pageSize, debouncedFilters, sortBy, sortOrder]);

  const { data, error, isLoading, mutate } = useSWR<BrandsResponse>(
    getApiUrl(),
    fetcher
  );

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

  const handleDelete = async (brandId: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    
    const success = await handleApiOperation(
      () => fetch(`/api/brands/${brandId}`, { method: 'DELETE' }),
      'Brand deleted successfully'
    );
    
    if (success) {
      setSelectedBrands(prev => prev.filter(id => id !== brandId));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedBrands.length} brands?`)) return;
    
    const success = await handleApiOperation(
      () => fetch('/api/brands/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandIds: selectedBrands }),
      }),
      `${selectedBrands.length} brands deleted successfully`
    );
    
    if (success) {
      setSelectedBrands([]);
    }
  };

  const handleExport = () => 
    handleApiOperation(
      async () => {
        const response = await fetch('/api/brands/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandIds: selectedBrands.length ? selectedBrands : 'all' }),
        });
        
        if (!response.ok) throw new Error('Failed to export brands');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brands.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return response;
      },
      'Brands exported successfully'
    );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedBrands([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedBrands([]);
  };

  const handleBulkStatusChange = async (isActive: boolean) => {
    if (!confirm(`Are you sure you want to mark ${selectedBrands.length} brands as ${isActive ? 'active' : 'inactive'}?`)) return;
    
    const success = await handleApiOperation(
      () => fetch('/api/brands/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brandIds: selectedBrands,
          isActive
        }),
      }),
      `${selectedBrands.length} brands marked as ${isActive ? 'active' : 'inactive'}`
    );
    
    if (success) {
      // If we're currently filtering by status, update the filter to show our changed items
      if ((filters.status as string[])?.length) {
        const newStatus = isActive ? 'active' : 'inactive';
        // If we're filtering for the opposite status, switch to the new status
        if (((filters.status as string[]).includes('active') && !isActive) || 
            ((filters.status as string[]).includes('inactive') && isActive)) {
          setFilters(prev => ({
            ...prev,
            status: [newStatus]
          }));
        }
      }
      mutate();
    }
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
      cell: ({ row, table }: { row: Brand; table: TableInstance & { getRowProps: (row: Brand) => { getIsSelected: () => boolean; getToggleSelectedHandler: () => () => void } } }) => {
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
          Brand Name
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
      cell: ({ row }: { row: Brand }) => (
        <div className="font-medium">{row.name}</div>
      ),
    },
    {
      header: 'Website',
      cell: ({ row }: { row: Brand }) => (
        row.website ? (
          <a 
            href={row.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            {row.website}
          </a>
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
      cell: ({ row }: { row: Brand }) => (
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
      cell: ({ row }: { row: Brand }) => {
        // Log the createdAt value for debugging
        if (typeof row.createdAt === 'object' && row.createdAt !== null) {
          console.log('Brand createdAt object:', row.createdAt);
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
      cell: ({ row }: { row: Brand }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/products/brands/${row.id}/edit`)}
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
        <p className="text-red-600 font-medium">Failed to load brands</p>
        <p className="text-red-500 text-sm mt-1">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => {
            console.log('Retrying brands fetch...');
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
        <h1 className="text-2xl font-semibold">Brands</h1>
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
          <Button onClick={() => router.push('/products/brands/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
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
      {selectedBrands.length > 0 && (
        <div className="flex items-center gap-4 py-4">
          <span className="text-sm text-gray-600">
            {selectedBrands.length} items selected
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange(true)}
              disabled={isLoadingOperation}
            >
              Mark as Active
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange(false)}
              disabled={isLoadingOperation}
            >
              Mark as Inactive
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          data={data?.brands ?? []}
          columns={columns}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedBrands,
            onSelectedRowsChange: setSelectedBrands,
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