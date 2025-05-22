'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { 
  Package, 
  Plus, 
  Download,
  Trash2, 
  Pencil,
  CheckSquare,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Ban,
  Filter,
  Search
} from 'lucide-react';
import Table from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { TableInstance } from '@/components/Table';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, type FilterState, type FilterConfig } from '@/components/ui/CommonFilters';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  isPublished: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

const filterConfig: FilterConfig = {
  search: {
    placeholder: 'Search products by name or SKU...',
  },
  filterGroups: [
    {
      name: 'Categories',
      key: 'categories',
      options: [
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'books', label: 'Books' },
        { value: 'home', label: 'Home' },
        { value: 'sports', label: 'Sports' },
        { value: 'toys', label: 'Toys' },
      ],
    },
    {
      name: 'Status',
      key: 'statuses',
      options: [
        { value: 'in_stock', label: 'In Stock' },
        { value: 'low_stock', label: 'Low Stock' },
        { value: 'out_of_stock', label: 'Out of Stock' },
      ],
    },
  ],
  hasValueRange: true,
  valueRangeLabel: 'Price Range',
  valueRangeType: 'currency',
};

const initialFilters: FilterState = {
  search: '',
  categories: [],
  statuses: [],
  valueRange: {
    min: '',
    max: '',
  },
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

export default function ProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
    setSelectedProducts([]);
  }, []);

  const getApiUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder,
    });

    if (filters.search) params.append('search', filters.search);
    
    if ((filters.categories as string[])?.length) {
      params.append('categories', (filters.categories as string[]).join(','));
    }
    
    if ((filters.statuses as string[])?.length) {
      params.append('statuses', (filters.statuses as string[]).join(','));
    }
    
    const valueRange = filters.valueRange as { min: string; max: string };
    if (valueRange?.min) params.append('priceMin', valueRange.min);
    if (valueRange?.max) params.append('priceMax', valueRange.max);

    return `/api/products?${params.toString()}`;
  }, [page, pageSize, filters, sortBy, sortOrder]);

  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
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

  const handleStatusChange = (productId: string, newStatus: string) => 
    handleApiOperation(
      () => fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, status: newStatus }),
      }),
      'Product status updated successfully'
    );

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const success = await handleApiOperation(
      () => fetch(`/api/products/${productId}`, { method: 'DELETE' }),
      'Product deleted successfully'
    );
    
    if (success) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    
    const success = await handleApiOperation(
      () => fetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProducts }),
      }),
      `${selectedProducts.length} products deleted successfully`
    );
    
    if (success) {
      setSelectedProducts([]);
    }
  };

  const handleBulkStatusChange = async (newStatus: 'in_stock' | 'low_stock' | 'out_of_stock') => {
    if (!confirm(`Are you sure you want to mark ${selectedProducts.length} products as ${newStatus.replace('_', ' ')}?`)) return;
    
    const success = await handleApiOperation(
      () => fetch('/api/products/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProducts, status: newStatus }),
      }),
      `${selectedProducts.length} products updated successfully`
    );
    
    if (success) {
      setSelectedProducts([]);
    }
  };

  const handleExport = () => 
    handleApiOperation(
      async () => {
        const response = await fetch('/api/products/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: selectedProducts.length ? selectedProducts : 'all' }),
        });
        
        if (!response.ok) throw new Error('Failed to export products');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return response;
      },
      'Products exported successfully'
    );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedProducts([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedProducts([]);
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
      cell: ({ row }: { row: Product }) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg">
            <Image
              src={row.image}
              alt={row.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-sm text-gray-500">
              ${row.price.toFixed(2)}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('category')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Category
          <span className="inline-flex">
            {sortBy === 'category' ? (
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
      cell: ({ row }: { row: Product }) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
          {row.category}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('stock')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Quantity
          <span className="inline-flex">
            {sortBy === 'stock' ? (
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
      cell: ({ row }: { row: Product }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.stock}</span>
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
            ${row.stock > 20 
              ? 'bg-green-100 text-green-700' 
              : row.stock > 0
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
            }`}
          >
            {row.stock > 20 ? 'High' : row.stock > 0 ? 'Low' : 'None'}
          </span>
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('status')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Inventory Status
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
      cell: ({ row }: { row: Product }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.status === 'in_stock'
            ? 'bg-green-100 text-green-700'
            : row.status === 'low_stock'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
          }`}
        >
          {row.status === 'in_stock' 
            ? 'Available' 
            : row.status === 'low_stock' 
            ? 'Limited' 
            : 'Unavailable'}
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
      cell: ({ row }: { row: Product }) => (
        <span className="text-sm text-gray-500">
          {formatDate(new Date(row.createdAt))}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: Product }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/products/${row.id}/edit`)}
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
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load products</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Products</h1>
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
          <Button onClick={() => router.push('/products/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CommonFilters
        config={filterConfig}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
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
              onClick={() => handleBulkStatusChange('in_stock')}
              disabled={isLoadingOperation}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Mark In Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange('out_of_stock')}
              disabled={isLoadingOperation}
            >
              <Ban className="h-4 w-4 mr-2" />
              Mark Out of Stock
            </Button>
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

      <div className="rounded-lg border border-gray-200">
        <Table
          data={data?.products ?? []}
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