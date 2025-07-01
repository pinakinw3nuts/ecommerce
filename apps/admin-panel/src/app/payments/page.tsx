'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard,
  Download,
  Trash2, 
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Table from '@/components/Table';
import { useToast } from '@/hooks/useToast';
import { TableInstance } from '@/components/Table';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, type FilterState, type FilterConfig } from '@/components/ui/CommonFilters';
import { 
  PaymentService,
  PaymentListParams,
  PaymentsResponse
} from '@/services/payment.service';
import { Payment, PaymentStatus, PaymentProvider, PaymentMethod } from '@/types/payment';
import { Column } from '@/components/Table';

// Filter configuration for payment list
const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search by Order ID or Transaction ID',
  },
  status: {
    type: 'select',
    placeholder: 'Filter by status',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
      { value: 'completed', label: 'Completed' },
      { value: 'failed', label: 'Failed' },
      { value: 'refunded', label: 'Refunded' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  provider: {
    type: 'select',
    placeholder: 'Filter by provider',
    options: [
      { value: 'stripe', label: 'Stripe' },
      { value: 'paypal', label: 'PayPal' },
      { value: 'razorpay', label: 'Razorpay' },
    ],
  },
  hasDateRange: {
    type: 'boolean',
    placeholder: 'Enable date range',
  },
  dateRangeLabel: {
    type: 'text',
    placeholder: 'Payment Date',
  },
  hasValueRange: {
    type: 'boolean',
    placeholder: 'Enable amount range',
  },
  valueRangeLabel: {
    type: 'text',
    placeholder: 'Amount Range',
  },
  valueRangeType: {
    type: 'text',
    placeholder: 'currency',
  },
};

// Filter state interface
interface PaymentFilterState extends FilterState {
  status: string[];
  provider: string[];
  dateRange: {
    from: string;
    to: string;
  };
  valueRange: {
    min: string;
    max: string;
  };
}

const initialFilters: PaymentFilterState = {
  search: '',
  status: [],
  provider: [],
  dateRange: { from: '', to: '' },
  valueRange: { min: '', max: '' },
};

export default function PaymentsPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [filters, setFilters] = useState<PaymentFilterState>(initialFilters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [hasError, setHasError] = useState(false);
  const [errorRetryCount, setErrorRetryCount] = useState(0);
  
  // Debug console.log to track lifecycle
  useEffect(() => {
    console.log('PaymentsPage rendered');
    
    return () => {
      console.log('PaymentsPage unmounted');
    };
  }, []);

  // Add a ref to track if this is the first render
  const isFirstRender = useRef(true);
  const previousFilters = useRef(debouncedFilters);

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
    setSelectedPayments([]);
  }, []);

  // Build API parameters with current filters
  const getApiParams = useMemo(() => {
    return (): PaymentListParams => {
      console.log('getApiParams called');
      const params: PaymentListParams = {
        page,
        pageSize,
        sortBy,
        sortOrder,
      };

      if (debouncedFilters.search) {
        // Check if search looks like a UUID (order ID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(debouncedFilters.search.toString())) {
          // If it's a UUID, search specifically in orderId
          params.orderId = debouncedFilters.search.toString();
        } else {
          // Otherwise use general search
          params.search = debouncedFilters.search.toString();
        }
      }
      
      if (debouncedFilters.status && debouncedFilters.status.length > 0) {
        params.status = debouncedFilters.status;
      }
      
      if (debouncedFilters.provider && debouncedFilters.provider.length > 0) {
        params.provider = debouncedFilters.provider;
      }
      
      if (debouncedFilters.dateRange.from) {
        params.fromDate = debouncedFilters.dateRange.from;
      }
      
      if (debouncedFilters.dateRange.to) {
        params.toDate = debouncedFilters.dateRange.to;
      }
      
      if (debouncedFilters.valueRange.min) {
        params.minAmount = debouncedFilters.valueRange.min;
      }
      
      if (debouncedFilters.valueRange.max) {
        params.maxAmount = debouncedFilters.valueRange.max;
      }
      
      console.log('API params:', params);
      return params;
    };
  }, [page, pageSize, sortBy, sortOrder, debouncedFilters]);

  // Initial data load
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Build initial params directly to avoid dependency issues
        const initialParams: PaymentListParams = {
          page,
          pageSize,
          sortBy,
          sortOrder,
        };
        
        console.log('Initial fetch with params:', initialParams);
        const result = await PaymentService.getPayments(initialParams);
        console.log('Initial data received:', {
          itemCount: result?.items?.length || 0,
          pagination: result?.pagination,
          firstItem: result?.items?.[0],
          allItems: result?.items
        });
        setData(result);
      } catch (error) {
        console.error('Failed to fetch initial payments:', error);
        toast.error('Failed to load payments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []); // Only run once on mount

  // Main fetch effect for filter changes
  useEffect(() => {
    let isMounted = true;

    // Skip if filters haven't actually changed
    if (JSON.stringify(previousFilters.current) === JSON.stringify(debouncedFilters)) {
      return;
    }
    previousFilters.current = debouncedFilters;

    const fetchData = async () => {
      if (hasError && errorRetryCount > 2) {
        console.log('Skipping fetch due to previous errors');
        return;
      }

      setIsLoading(true);
      try {
        const params = getApiParams();
        console.log('Fetching with params:', params);
        const result = await PaymentService.getPayments(params);
        
        if (isMounted) {
          console.log('Fetch successful, data:', {
            itemsCount: result?.items?.length || 0,
            pagination: result?.pagination
          });
          setData(result);
          setHasError(false);
          setErrorRetryCount(0);
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error);
        if (isMounted) {
          setHasError(true);
          setErrorRetryCount(prev => prev + 1);
          toast.error('Failed to load payments');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [debouncedFilters, page, pageSize, sortBy, sortOrder]);

  // Handle pagination bounds
  useEffect(() => {
    if (!data?.pagination) return;

    // Only adjust page if we have results and current page is out of bounds
    if (data.pagination.total > 0 && page > Math.ceil(data.pagination.total / pageSize)) {
      setPage(Math.ceil(data.pagination.total / pageSize));
    }
  }, [data?.pagination?.total, pageSize, page]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleApiOperation = async (operation: () => Promise<any>, successMessage: string) => {
    setIsLoadingOperation(true);
    try {
      await operation();
      toast.success(successMessage);
      
      // Refresh data after operation
      const params = getApiParams();
      const result = await PaymentService.getPayments(params);
      setData(result);
      setSelectedPayments([]);
    } catch (error) {
      console.error('Operation failed:', error);
      toast.error('Operation failed. Please try again.');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    await handleApiOperation(
      () => PaymentService.deletePayment(paymentId),
      'Payment deleted successfully'
    );
  };

  const handleBulkDelete = async () => {
    if (selectedPayments.length === 0) {
      toast.error('No payments selected');
      return;
    }

    await handleApiOperation(
      () => PaymentService.bulkDeletePayments(selectedPayments),
      `${selectedPayments.length} payments deleted successfully`
    );
  };

  const handleExport = async () => {
    setIsLoadingOperation(true);
    try {
      const params = getApiParams();
      const blob = await PaymentService.exportPayments(params);
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleViewPayment = (paymentId: string) => {
    router.push(`/payments/${paymentId}`);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters as PaymentFilterState);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedPayments([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedPayments([]);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Define columns for the payments table
  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: any }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
      ),
      cell: ({ row, table }: { row: any; table: any }) => {
        const rowProps = table.getRowProps(row);
        return (
          <div>
            <input
              type="checkbox"
              checked={rowProps.getIsSelected()}
              onChange={rowProps.getToggleSelectedHandler()}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
          </div>
        );
      },
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('orderId')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Order ID
          <span className="inline-flex">
            {sortBy === 'orderId' ? (
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
      accessorKey: 'orderId',
      cell: ({ row }: { row: any }) => (
        <div className="font-medium">{row.orderId || 'N/A'}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('id')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Transaction ID
          <span className="inline-flex">
            {sortBy === 'id' ? (
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
      accessorKey: 'id',
      cell: ({ row }: { row: any }) => (
        <div className="font-mono text-sm">{row.id || 'N/A'}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('amount')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Amount
          <span className="inline-flex">
            {sortBy === 'amount' ? (
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
      accessorKey: 'amount',
      cell: ({ row }: { row: any }) => {
        if (!row || row.amount === undefined || row.amount === null) {
          return <div className="font-medium">N/A</div>;
        }
        
        try {
          return (
            <div className="font-medium">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: row.currency || 'USD'
              }).format(row.amount)}
            </div>
          );
        } catch (error) {
          console.error('Error formatting amount:', error);
          return <div className="font-medium">Error</div>;
        }
      },
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
      accessorKey: 'status',
      cell: ({ row }: { row: any }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(row.status || 'pending')}`}>
          {row.status || 'pending'}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('provider')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Provider
          <span className="inline-flex">
            {sortBy === 'provider' ? (
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
      accessorKey: 'provider',
      cell: ({ row }: { row: any }) => (
        <div className="capitalize">{row.provider || 'N/A'}</div>
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
      accessorKey: 'createdAt',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm">{row.createdAt ? formatDate(row.createdAt) : 'N/A'}</div>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => row.id && handleViewPayment(row.id)}
            disabled={!row.id}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => row.id && handleDelete(row.id)}
            disabled={isLoadingOperation || !row.id}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ] as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
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
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={selectedPayments.length === 0 || isLoadingOperation}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CommonFilters
        config={filterConfig}
        filters={filters}
        onChange={handleFiltersChange}
        onReset={resetFilters}
      />

      {/* Table */}
      <div className="rounded-lg border border-gray-200">
        <Table
          data={data?.items || []}
          columns={columns}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedPayments,
            onSelectedRowsChange: setSelectedPayments,
          }}
          pagination={{
            page,
            pageSize,
            total: data?.pagination?.total || 0,
            onPageChange: handlePageChange
          }}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <CreditCard className="h-12 w-12 text-gray-400" />
              <div className="text-lg font-semibold text-gray-700">No payments found</div>
              <div className="text-sm text-gray-500">There are no payments matching your criteria.</div>
            </div>
          }
        />

        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {data?.pagination ? (page - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {data?.pagination
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

          {data?.pagination && (
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={data.pagination.total}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}