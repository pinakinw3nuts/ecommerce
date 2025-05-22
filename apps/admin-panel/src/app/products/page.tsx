'use client';

import { useState, useCallback } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Download,
  Trash2, 
  Eye, 
  EyeOff,
  Pencil,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Ban
} from 'lucide-react';
import Table from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { TableInstance } from '@/components/Table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import { ProductFilters } from '@/components/products/ProductFilters';

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
  const [filters, setFilters] = useState({
    search: '',
    categories: [] as string[],
    statuses: [] as string[],
    dateRange: {
      from: '',
      to: '',
    },
    priceRange: {
      min: '',
      max: '',
    },
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);

  const getApiUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder,
    });

    if (filters.search) params.append('search', filters.search);
    if (filters.categories.length) params.append('categories', filters.categories.join(','));
    if (filters.statuses.length) params.append('statuses', filters.statuses.join(','));
    if (filters.dateRange.from) params.append('dateFrom', filters.dateRange.from);
    if (filters.dateRange.to) params.append('dateTo', filters.dateRange.to);
    if (filters.priceRange.min) params.append('priceMin', filters.priceRange.min);
    if (filters.priceRange.max) params.append('priceMax', filters.priceRange.max);

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

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ChevronsUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      setIsLoadingOperation(true);
      const response = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success('Product status updated successfully');
      mutate();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setIsLoadingOperation(true);
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      toast.success('Product deleted successfully');
      mutate();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

    try {
      setIsLoadingOperation(true);
      const response = await fetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: selectedProducts }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete products');
      }

      mutate();
      setSelectedProducts([]);
      toast.success(`${selectedProducts.length} products deleted successfully`);
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Failed to delete products');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: 'in_stock' | 'low_stock' | 'out_of_stock') => {
    if (!confirm(`Are you sure you want to mark ${selectedProducts.length} products as ${newStatus.replace('_', ' ')}?`)) return;

    try {
      setIsLoadingOperation(true);
      const response = await fetch('/api/products/bulk-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          productIds: selectedProducts,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update products');
      }

      mutate();
      setSelectedProducts([]);
      toast.success(`${data.updatedCount} products updated successfully`);
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update products');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoadingOperation(true);
      const response = await fetch('/api/products/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: selectedProducts.length ? selectedProducts : 'all' }),
      });

      if (!response.ok) {
        throw new Error('Failed to export products');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('Failed to export products');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedProducts([]); // Clear selection when changing pages
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
    setSelectedProducts([]); // Clear selection
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isLoadingOperation}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/products/new')}
            disabled={isLoadingOperation}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <ProductFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => {
            setFilters({
              search: '',
              categories: [],
              statuses: [],
              dateRange: { from: '', to: '' },
              priceRange: { min: '', max: '' },
            });
            setPage(1);
            setSelectedProducts([]); // Clear selection when filters reset
          }}
        />
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            {selectedProducts.length} products selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
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
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoadingOperation}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
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

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={!data?.pagination.hasMore || isLoading}
            >
              Next
            </Button>
          </div>

          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
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
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                  setSelectedProducts([]); // Clear selection
                }}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1 || isLoading}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: data?.pagination.totalPages || 0 }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === data?.pagination.totalPages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        disabled={isLoading}
                        className={`min-w-[32px] rounded px-2 py-1 text-sm ${
                          p === page
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!data?.pagination.hasMore || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(data?.pagination.totalPages || 1)}
                disabled={page === data?.pagination.totalPages || isLoading}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 