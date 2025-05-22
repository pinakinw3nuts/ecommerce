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
  Filter,
  X,
  Search,
  Plus,
} from 'lucide-react';
import Table, { type Column, TableInstance } from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, FilterConfig, FilterState } from '@/components/ui/CommonFilters';
import { format } from 'date-fns';

interface PaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  total: number;
  items: number;
  createdAt: string;
}

interface ApiResponse {
  orders: Order[];
  pagination: PaginationData;
}

interface OrderFilterState extends FilterState {
  status: string[];
  paymentStatus: string[];
  dateRange: {
    from: string;
    to: string;
  };
  valueRange: {
    min: string;
    max: string;
  };
}

const filterConfig: FilterConfig = {
  search: {
    placeholder: 'Search orders by ID or customer...',
  },
  filterGroups: [
    {
      name: 'Status',
      key: 'status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      name: 'Payment Status',
      key: 'paymentStatus',
      options: [
        { value: 'paid', label: 'Paid' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' },
      ],
    },
  ],
  hasDateRange: true,
  dateRangeLabel: 'Order Date',
  hasValueRange: true,
  valueRangeLabel: 'Order Value',
  valueRangeType: 'currency',
};

const initialFilters: OrderFilterState = {
  search: '',
  status: [],
  paymentStatus: [],
  dateRange: { from: '', to: '' },
  valueRange: { min: '', max: '' },
};

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  
  return response.json();
};

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<OrderFilterState>(initialFilters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const hasActiveFilters = 
    filters.search ||
    filters.status.length > 0 ||
    filters.paymentStatus.length > 0 ||
    filters.dateRange.from ||
    filters.dateRange.to ||
    filters.valueRange.min ||
    filters.valueRange.max;

  const queryString = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(filters.search && { search: filters.search }),
    ...(filters.status.length && { status: filters.status.join(',') }),
    ...(filters.paymentStatus.length && { paymentStatus: filters.paymentStatus.join(',') }),
    ...(filters.dateRange.from && { fromDate: filters.dateRange.from }),
    ...(filters.dateRange.to && { toDate: filters.dateRange.to }),
    ...(filters.valueRange.min && { minValue: filters.valueRange.min }),
    ...(filters.valueRange.max && { maxValue: filters.valueRange.max }),
    sortBy,
    sortOrder,
  }).toString();

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    `/api/orders?${queryString}`,
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
    setSelectedOrders([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedOrders([]);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters as OrderFilterState);
    setPage(1);
    setSelectedOrders([]);
  };

  const handleFiltersReset = () => {
    setFilters(initialFilters);
    setPage(1);
    setSelectedOrders([]);
  };

  const columns: Column<Order>[] = [
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
      accessorKey: 'orderNumber' as keyof Order,
      cell: ({ row }: { row: Order }) => (
        <div className="font-medium text-blue-600">#{row.orderNumber}</div>
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
      accessorKey: 'customerName' as keyof Order,
      cell: ({ row }: { row: Order }) => (
        <div>
          <div className="font-medium">{row.customerName}</div>
          <div className="text-sm text-gray-500">{row.customerEmail}</div>
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
      accessorKey: 'status' as keyof Order,
      cell: ({ row }: { row: Order }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.status === 'completed'
            ? 'bg-green-100 text-green-700'
            : row.status === 'processing'
            ? 'bg-blue-100 text-blue-700'
            : row.status === 'cancelled'
            ? 'bg-red-100 text-red-700'
            : 'bg-yellow-100 text-yellow-700'
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
      accessorKey: 'paymentStatus' as keyof Order,
      cell: ({ row }: { row: Order }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.paymentStatus === 'paid'
            ? 'bg-green-100 text-green-700'
            : row.paymentStatus === 'refunded'
            ? 'bg-orange-100 text-orange-700'
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
      accessorKey: 'total' as keyof Order,
      cell: ({ row }: { row: Order }) => (
        <div className="font-medium">
          ${row.total.toFixed(2)}
          <div className="text-sm text-gray-500">{row.items} items</div>
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('createdAt')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Date
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
      accessorKey: 'createdAt' as keyof Order,
      cell: ({ row }: { row: Order }) => (
        <span className="text-sm text-gray-500">
          {format(new Date(row.createdAt), 'MMM d, yyyy')}
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
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Orders</h1>
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
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-4 py-4">
          <span className="text-sm text-gray-600">
            {selectedOrders.length} items selected
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
          data={data?.orders ?? []}
          columns={columns}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedOrders,
            onSelectedRowsChange: setSelectedOrders,
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