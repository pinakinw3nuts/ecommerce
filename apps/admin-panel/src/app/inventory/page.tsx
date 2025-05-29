'use client';

import React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { 
  Package,
  Download,
  Plus, 
  Search,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Table, { type Column, TableInstance } from '@/components/Table';
import { useToast } from '@/hooks/useToast';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, FilterConfig, FilterState } from '@/components/ui/CommonFilters';

interface PaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  quantity: number;
  price: number;
  lastUpdated: string;
}

interface ApiResponse {
  products: Product[];
  pagination: PaginationData;
}

interface InventoryFilterState extends FilterState {
  categories: string[];
  status: string[];
  valueRange: {
    min: string;
    max: string;
  };
  dateRange: {
    from: string;
    to: string;
  };
}

const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search inventory...',
  },
  categories: {
    type: 'select',
    placeholder: 'Category',
    options: [
      { value: 'electronics', label: 'Electronics' },
      { value: 'clothing', label: 'Clothing' },
      { value: 'books', label: 'Books' },
      { value: 'home', label: 'Home & Garden' },
      { value: 'sports', label: 'Sports' },
    ],
  },
  status: {
    type: 'select',
    placeholder: 'Status',
    options: [
      { value: 'in_stock', label: 'In Stock' },
      { value: 'low_stock', label: 'Low Stock' },
      { value: 'out_of_stock', label: 'Out of Stock' },
    ],
  },
  valueRange: {
    type: 'valueRange',
    placeholder: 'Price Range',
  },
  dateRange: {
    type: 'daterange',
    placeholder: 'Created Date',
  },
};

const initialFilters: InventoryFilterState = {
  search: '',
  categories: [],
  status: [],
  valueRange: { min: '', max: '' },
  dateRange: { from: '', to: '' },
};

const fetcher = async (url: string) => {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
  
    return response.json();
  } catch (error) {
    console.error('Fetch Error:', error);
    throw error;
  }
};

export default function InventoryPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('lastUpdated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<InventoryFilterState>(initialFilters);

  const hasActiveFilters = 
    filters.search ||
    filters.categories.length > 0 ||
    filters.status.length > 0 ||
    filters.valueRange.min ||
    filters.valueRange.max ||
    filters.dateRange.from ||
    filters.dateRange.to;

  // Build query string from filters
  const queryString = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(filters.search && { search: filters.search }),
    ...(filters.categories.length && { categories: filters.categories.join(',') }),
    ...(filters.status.length && { status: filters.status.join(',') }),
    ...(filters.valueRange.min && { minPrice: filters.valueRange.min }),
    ...(filters.valueRange.max && { maxPrice: filters.valueRange.max }),
    ...(filters.dateRange.from && { minDate: filters.dateRange.from }),
    ...(filters.dateRange.to && { maxDate: filters.dateRange.to }),
    sortBy,
    sortOrder,
  }).toString();

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    `/api/inventory?${queryString}`,
    fetcher
  );

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters as InventoryFilterState);
    setPage(1);
    setSelectedProducts([]);
  };

  const handleFiltersReset = () => {
    setFilters(initialFilters);
    setPage(1);
    setSelectedProducts([]);
  };

  const handleExport = async () => {
    try {
      setIsLoadingOperation(true);
      const response = await fetch('/api/inventory/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: selectedProducts.length ? selectedProducts : 'all' }),
      });

      if (!response.ok) {
        throw new Error('Failed to export inventory');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Inventory exported successfully');
    } catch (error) {
      console.error('Error exporting inventory:', error);
      toast.error('Failed to export inventory');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedProducts([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedProducts([]);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProducts.length) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      return;
    }

    try {
      setIsLoadingOperation(true);
      const response = await fetch('/api/inventory/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: selectedProducts }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete products');
      }

      await mutate();
      setSelectedProducts([]);
      toast.success(`Successfully deleted ${selectedProducts.length} products`);
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Failed to delete products');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      header: ({ table }: { table: TableInstance }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row, table }: { row: Product; table: TableInstance & { getRowProps: (row: Product) => { getIsSelected: () => boolean; getToggleSelectedHandler: () => () => void } } }) => {
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
          onClick={() => handleSort('sku')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          SKU
          <span className="inline-flex">
            {sortBy === 'sku' ? (
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
      accessorKey: 'sku' as keyof Product,
      cell: ({ row }: { row: Product }) => (
        <div className="font-medium text-blue-600">{row.sku}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('name')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Product
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
      accessorKey: 'name' as keyof Product,
      cell: ({ row }: { row: Product }) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.category}</div>
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('status')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Status
          <span className="inline-flex">
            {sortBy === 'status' ? (
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
      accessorKey: 'status' as keyof Product,
      cell: ({ row }: { row: Product }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.status === 'in_stock'
            ? 'bg-green-100 text-green-700'
            : row.status === 'low_stock'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
          }`}
        >
          {row.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('quantity')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Stock
          <span className="inline-flex">
            {sortBy === 'quantity' ? (
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
      accessorKey: 'quantity' as keyof Product,
      cell: ({ row }: { row: Product }) => (
        <div className="font-medium">{row.quantity}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('price')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Price
          <span className="inline-flex">
            {sortBy === 'price' ? (
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
      accessorKey: 'price' as keyof Product,
      cell: ({ row }: { row: Product }) => (
        <div className="font-medium">${row.price.toFixed(2)}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('lastUpdated')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Last Updated
          <span className="inline-flex">
            {sortBy === 'lastUpdated' ? (
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
      accessorKey: 'lastUpdated' as keyof Product,
      cell: ({ row }: { row: Product }) => (
        <span className="text-sm text-gray-500">
          {format(new Date(row.lastUpdated), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex flex-col gap-2">
          <p className="text-red-600 font-medium">Failed to load inventory</p>
          <p className="text-red-500 text-sm">{error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            className="self-start"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isLoadingOperation}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push('/inventory/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CommonFilters
        config={filterConfig}
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleFiltersReset}
      />

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-4 py-4">
          <span className="text-sm text-gray-600">
            {selectedProducts.length} items selected
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

      {/* Table */}
      <div className="rounded-lg border border-gray-200">
        <Table
          data={data?.products || []}
          columns={columns}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedProducts,
            onSelectedRowsChange: setSelectedProducts,
          }}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {data ? (page - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {data
                  ? Math.min(page * pageSize, data.pagination.total)
                  : 0}
              </span>{' '}
              of{' '}
              <span className="font-medium">{data?.pagination.total || 0}</span>{' '}
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
            totalItems={data?.pagination.total || 0}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
} 