'use client';

import { useState, useCallback, useEffect } from 'react';
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
import Table, { type Column } from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, FilterConfig, FilterState } from '@/components/ui/CommonFilters';
import { format } from 'date-fns';
import { OrderFilters, OrdersResponse, Order, PaginationOptions, OrderStatus, PaymentStatus } from '@/types/orders';
import { orderApi } from '@/lib/order-api-client';
import { orderService } from '@/services/orders';

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
    type: 'text',
    placeholder: 'Search orders by ID or customer...',
  },
  filterGroups: {
    type: 'select',
    placeholder: 'Filter by group',
    options: [
      { value: 'status', label: 'Status' },
      { value: 'paymentStatus', label: 'Payment Status' }
    ]
  },
  status: {
    type: 'select',
    placeholder: 'Filter by status',
    options: [
      { value: OrderStatus.PENDING, label: 'Pending' },
      { value: OrderStatus.CONFIRMED, label: 'Confirmed' },
      { value: OrderStatus.PROCESSING, label: 'Processing' },
      { value: OrderStatus.SHIPPED, label: 'Shipped' },
      { value: OrderStatus.DELIVERED, label: 'Delivered' },
      { value: OrderStatus.CANCELLED, label: 'Cancelled' },
      { value: OrderStatus.FAILED, label: 'Failed' },
    ],
  },
  paymentStatus: {
    type: 'select',
    placeholder: 'Filter by payment status',
    options: [
      { value: PaymentStatus.PENDING, label: 'Pending' },
      { value: PaymentStatus.PAID, label: 'Paid' },
      { value: PaymentStatus.PARTIALLY_PAID, label: 'Partially Paid' },
      { value: PaymentStatus.FAILED, label: 'Failed' },
      { value: PaymentStatus.REFUNDED, label: 'Refunded' },
      { value: PaymentStatus.PARTIALLY_REFUNDED, label: 'Partially Refunded' },
    ],
  },
  hasDateRange: {
    type: 'boolean',
    placeholder: 'Enable date range',
  },
  dateRangeLabel: {
    type: 'text',
    placeholder: 'Order Date',
  },
  hasValueRange: {
    type: 'boolean',
    placeholder: 'Enable value range',
  },
  valueRangeLabel: {
    type: 'text',
    placeholder: 'Order Value',
  },
  valueRangeType: {
    type: 'text',
    placeholder: 'currency',
  },
};

const initialFilters: OrderFilterState = {
  search: '',
  status: [],
  paymentStatus: [],
  dateRange: { from: '', to: '' },
  valueRange: { min: '', max: '' },
};

// Update the fetcher function to use the new orderApi
const fetcher = async (url: string) => {
  // Extract query parameters from URL
  const searchParams = new URL(url, window.location.origin).searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const minValue = searchParams.get('minValue');
  const maxValue = searchParams.get('maxValue');
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('sortOrder') as 'ASC' | 'DESC' | undefined;

  const filters: OrderFilters = {
    status,
    search,
    startDate: fromDate ? new Date(fromDate) : undefined,
    endDate: toDate ? new Date(toDate) : undefined,
    minAmount: minValue ? parseFloat(minValue) : undefined,
    maxAmount: maxValue ? parseFloat(maxValue) : undefined,
  };

  const pagination: PaginationOptions = {
    page,
    limit: pageSize,
    sortBy: sortBy || undefined,
    order: order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC',
  };

  return await orderApi.listOrders(filters, pagination);
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

  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
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
      await orderApi.deleteOrder(orderId);
      toast.success('Order deleted successfully');
      mutate();
      
      // If the order was selected, remove it from the selection
      if (selectedOrders.includes(orderId)) {
        setSelectedOrders(prev => prev.filter(id => id !== orderId));
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedOrders.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) return;
    
    try {
      setIsLoadingOperation(true);
      await orderApi.bulkDeleteOrders(selectedOrders);
      toast.success(`${selectedOrders.length} orders deleted successfully`);
      setSelectedOrders([]);
      mutate();
    } catch (error) {
      console.error('Error bulk deleting orders:', error);
      toast.error('Failed to delete orders');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoadingOperation(true);
      
      // Build filters from current filter state
      const exportFilters: OrderFilters = {
        search: filters.search,
        status: filters.status.length ? filters.status.join(',') : undefined,
        startDate: filters.dateRange.from ? new Date(filters.dateRange.from) : undefined,
        endDate: filters.dateRange.to ? new Date(filters.dateRange.to) : undefined,
        minAmount: filters.valueRange.min ? parseFloat(filters.valueRange.min) : undefined,
        maxAmount: filters.valueRange.max ? parseFloat(filters.valueRange.max) : undefined,
      };
      
      const blob = await orderApi.exportOrders(exportFilters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
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
    window.scrollTo(0, 0);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters as OrderFilterState);
    setPage(1);
  };

  const handleFiltersReset = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  // Define columns for the table
  const columns: Column<Order>[] = [
    {
      accessorKey: 'id',
      header: (
        <input
          type="checkbox"
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={selectedOrders.length > 0 && selectedOrders.length === data?.orders.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedOrders(data?.orders.map(order => order.id) || []);
            } else {
              setSelectedOrders([]);
            }
          }}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={selectedOrders.includes(row.id as string)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedOrders([...selectedOrders, row.id as string]);
            } else {
              setSelectedOrders(selectedOrders.filter(id => id !== row.id));
            }
          }}
        />
      ),
    },
    {
      accessorKey: 'orderNumber',
      header: (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('orderNumber')}
        >
          Order ID
          {sortBy === 'orderNumber' ? (
            sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
          )}
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.orderNumber || (typeof row.id === 'string' ? String(row.id).substring(0, 8) : row.id)}
        </div>
      ),
    },
    {
      accessorKey: 'customerName',
      header: (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('customerName')}
        >
          Customer
          {sortBy === 'customerName' ? (
            sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
          )}
        </div>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.customerName || (row.userId ? `User: ${row.userId.substring(0, 8)}...` : 'N/A')}
          </div>
          <div className="text-sm text-gray-500">
            {row.customerEmail || (row.userId ? row.userId : '')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('totalAmount')}
        >
          Total
          {sortBy === 'totalAmount' ? (
            sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
          )}
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          ${row.totalAmount.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('status')}
        >
          Status
          {sortBy === 'status' ? (
            sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
          )}
        </div>
      ),
      cell: ({ row }) => {
        const statusClasses = {
          [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
          [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
          [OrderStatus.PROCESSING]: 'bg-purple-100 text-purple-800',
          [OrderStatus.SHIPPED]: 'bg-green-100 text-green-800',
          [OrderStatus.DELIVERED]: 'bg-purple-100 text-purple-800',
          [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
          [OrderStatus.FAILED]: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[row.status as OrderStatus]}`}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('paymentStatus')}
        >
          Payment
          {sortBy === 'paymentStatus' ? (
            sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
          )}
        </div>
      ),
      cell: ({ row }) => {
        if (!row.paymentStatus) return <span>-</span>;

        const paymentStatusClasses = {
          [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
          [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
          [PaymentStatus.PARTIALLY_PAID]: 'bg-blue-100 text-blue-800',
          [PaymentStatus.FAILED]: 'bg-gray-100 text-gray-800',
          [PaymentStatus.REFUNDED]: 'bg-red-100 text-red-800',
          [PaymentStatus.PARTIALLY_REFUNDED]: 'bg-purple-100 text-purple-800',
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusClasses[row.paymentStatus as PaymentStatus]}`}>
            {row.paymentStatus.charAt(0).toUpperCase() + row.paymentStatus.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('createdAt')}
        >
          Date
          {sortBy === 'createdAt' ? (
            sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
          )}
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.createdAt)}</div>
      ),
    },
    {
      accessorKey: undefined,
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/orders/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">View and manage orders from customers</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            disabled={isLoadingOperation}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant="destructive"
            disabled={selectedOrders.length === 0 || isLoadingOperation}
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedOrders.length})
          </Button>

          <Button
            variant={isFiltersOpen ? "default" : "outline"}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {isFiltersOpen ? 'Hide Filters' : 'Filter'}
            {hasActiveFilters && !isFiltersOpen ? (
              <span className="ml-1 flex h-2 w-2 rounded-full bg-blue-600"></span>
            ) : null}
          </Button>
        </div>
      </div>

      {isFiltersOpen && (
        <div className="border border-gray-200 rounded-md p-4 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Filters</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFiltersOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <CommonFilters
            config={filterConfig}
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleFiltersReset}
          />
        </div>
      )}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">Failed to load orders</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table
              columns={columns}
              data={data?.orders || []}
              isLoading={isLoading || isLoadingOperation}
              selection={{
                selectedRows: selectedOrders,
                onSelectedRowsChange: setSelectedOrders
              }}
            />
            {data?.orders && data.orders.length === 0 && !isLoading && (
              <div className="text-center py-10">
                <ShoppingBag className="h-10 w-10 text-gray-400 mb-3 mx-auto" />
                <h3 className="text-sm font-medium text-gray-900">No orders found</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters.' : 'Orders will appear here when customers place them.'}
                </p>
              </div>
            )}
          </div>

          {data?.pagination && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} orders
              </p>
              <Pagination
                currentPage={page}
                pageSize={pageSize}
                totalItems={data.pagination?.total || 0}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
} 