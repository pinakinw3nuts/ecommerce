'use client';

import { useState, useCallback } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  ShoppingBag, 
  Download,
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import Table from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { TableInstance } from '@/components/Table';
import { formatDate } from '@/lib/utils';
import { OrderFilters } from '@/components/orders/OrderFilters';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

interface OrdersResponse {
  orders: Order[];
  pagination: PaginationInfo;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: [] as string[],
    paymentStatus: [] as string[],
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
    if (filters.status.length) params.append('status', filters.status.join(','));
    if (filters.paymentStatus.length) params.append('paymentStatus', filters.paymentStatus.join(','));
    if (filters.dateRange.from) params.append('dateFrom', filters.dateRange.from);
    if (filters.dateRange.to) params.append('dateTo', filters.dateRange.to);
    if (filters.priceRange.min) params.append('priceMin', filters.priceRange.min);
    if (filters.priceRange.max) params.append('priceMax', filters.priceRange.max);

    return `/api/orders?${params.toString()}`;
  }, [page, pageSize, filters, sortBy, sortOrder]);

  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
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

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      setIsLoadingOperation(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete order');

      toast.success('Order deleted successfully');
      mutate();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) return;

    try {
      setIsLoadingOperation(true);
      const response = await fetch('/api/orders/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete orders');
      }

      mutate();
      setSelectedOrders([]);
      toast.success(`${selectedOrders.length} orders deleted successfully`);
    } catch (error) {
      console.error('Error deleting orders:', error);
      toast.error('Failed to delete orders');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoadingOperation(true);
      const response = await fetch('/api/orders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds: selectedOrders.length ? selectedOrders : 'all' }),
      });

      if (!response.ok) {
        throw new Error('Failed to export orders');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Orders exported successfully');
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedOrders([]); // Clear selection when changing pages
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
    setSelectedOrders([]); // Clear selection
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
      cell: ({ row, table }: { row: Order; table: TableInstance & { getRowProps: (row: Order) => { getIsSelected: () => boolean; getToggleSelectedHandler: () => () => void } } }) => {
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
          onClick={() => handleSort('orderNumber')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Order Number
          <span className="inline-flex">
            {sortBy === 'orderNumber' ? (
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
      cell: ({ row }: { row: Order }) => (
        <div className="font-medium">{row.orderNumber}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('customerName')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Customer
          <span className="inline-flex">
            {sortBy === 'customerName' ? (
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
      cell: ({ row }: { row: Order }) => (
        <div>
          <div className="font-medium">{row.customerName}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('total')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Total
          <span className="inline-flex">
            {sortBy === 'total' ? (
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
      cell: ({ row }: { row: Order }) => (
        <div className="font-medium">${row.total.toFixed(2)}</div>
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
      cell: ({ row }: { row: Order }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.status === 'completed'
            ? 'bg-green-100 text-green-700'
            : row.status === 'processing'
            ? 'bg-blue-100 text-blue-700'
            : row.status === 'pending'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
          }`}
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('paymentStatus')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Payment
          <span className="inline-flex">
            {sortBy === 'paymentStatus' ? (
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
      cell: ({ row }: { row: Order }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.paymentStatus === 'paid'
            ? 'bg-green-100 text-green-700'
            : row.paymentStatus === 'unpaid'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
          }`}
        >
          {row.paymentStatus.charAt(0).toUpperCase() + row.paymentStatus.slice(1)}
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
      cell: ({ row }: { row: Order }) => (
        <span className="text-sm text-gray-500">
          {formatDate(new Date(row.createdAt))}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: Order }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/orders/${row.id}`)}
            disabled={isLoadingOperation}
          >
            <Eye className="h-4 w-4" />
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
        <p className="text-red-600">Failed to load orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
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
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <OrderFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => {
            setFilters({
              search: '',
              status: [],
              paymentStatus: [],
              dateRange: { from: '', to: '' },
              priceRange: { min: '', max: '' },
            });
            setPage(1);
            setSelectedOrders([]); // Clear selection when filters reset
          }}
        />
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            {selectedOrders.length} orders selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
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
          data={data?.orders ?? []}
          columns={columns}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedOrders,
            onSelectedRowsChange: setSelectedOrders,
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
                  setSelectedOrders([]); // Clear selection
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