'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  CreditCard,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Table from '@/components/Table';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, type FilterState, type FilterConfig } from '@/components/ui/CommonFilters';
import { 
  PaymentService,
  PaymentMethodListParams,
} from '@/services/payment.service';
import { 
  PaymentMethod, 
  PaymentMethodStatus, 
  PaymentMethodType,
  PaymentMethodsResponse,
} from '@/types/payment';

// Filter configuration
const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search by brand or last 4 digits',
  },
  status: {
    type: 'select',
    placeholder: 'Filter by status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  type: {
    type: 'select',
    placeholder: 'Filter by type',
    options: [
      { value: 'card', label: 'Card' },
      { value: 'bank_account', label: 'Bank Account' },
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
};

// Filter state interface
interface PaymentMethodFilterState extends FilterState {
  status: string[];
  type: string[];
  provider: string[];
}

const initialFilters: PaymentMethodFilterState = {
  search: '',
  status: [],
  type: [],
  provider: [],
};

export default function PaymentMethodsPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [filters, setFilters] = useState<PaymentMethodFilterState>(initialFilters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PaymentMethodsResponse | null>(null);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [hasError, setHasError] = useState(false);
  const [errorRetryCount, setErrorRetryCount] = useState(0);
  
  // Add a ref to track if this is the first render
  const isFirstRender = useRef(true);
  const previousFilters = useRef(debouncedFilters);

  // Debug console.log to track lifecycle
  useEffect(() => {
    console.log('PaymentMethodsPage rendered');
    
    return () => {
      console.log('PaymentMethodsPage unmounted');
    };
  }, []);

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
    setSelectedPaymentMethods([]);
  }, []);

  // Build API parameters with current filters
  const getApiParams = useMemo(() => {
    return (): PaymentMethodListParams => {
      console.log('getApiParams called');
      const params: PaymentMethodListParams = {
        page,
        pageSize,
        sortBy,
        sortOrder,
      };
  
      if (debouncedFilters.search) {
        params.search = debouncedFilters.search.toString();
      }
      
      if (debouncedFilters.status.length > 0) {
        params.status = debouncedFilters.status;
      }
      
      if (debouncedFilters.type.length > 0) {
        params.type = debouncedFilters.type;
      }
      
      if (debouncedFilters.provider.length > 0) {
        params.provider = debouncedFilters.provider;
      }
      
      return params;
    };
  }, [page, pageSize, sortBy, sortOrder, debouncedFilters]);

  // Initial data load
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const params = getApiParams();
        const result = await PaymentService.getPaymentMethods(params);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch initial payment methods:', error);
        toast.error('Failed to load payment methods');
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
        const result = await PaymentService.getPaymentMethods(params);
        
        if (isMounted) {
          setData(result);
          setHasError(false);
          setErrorRetryCount(0);
        }
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
        if (isMounted) {
          toast.error('Failed to load payment methods');
          setHasError(true);
          setErrorRetryCount(prev => prev + 1);
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
    try {
      setIsLoadingOperation(true);
      await operation();
      
      // Show success message
      toast.success(successMessage);
      
      // Refresh data with current parameters
      try {
        const params = getApiParams();
        const result = await PaymentService.getPaymentMethods(params);
        setData(result);
        setSelectedPaymentMethods([]);
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
        // Don't show another error for the refresh operation
      }
    } catch (error) {
      console.error('Operation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    await handleApiOperation(
      () => PaymentService.deletePaymentMethod(paymentMethodId),
      'Payment method deleted successfully'
    );
  };

  const handleBulkDelete = async () => {
    if (selectedPaymentMethods.length === 0) {
      toast.error('No payment methods selected');
      return;
    }

    await handleApiOperation(
      () => PaymentService.bulkDeletePaymentMethods(selectedPaymentMethods),
      `${selectedPaymentMethods.length} payment methods deleted successfully`
    );
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    await handleApiOperation(
      () => PaymentService.setPaymentMethodDefault(paymentMethodId),
      'Default payment method updated successfully'
    );
  };

  const handleToggleStatus = async (paymentMethodId: string, currentStatus: PaymentMethodStatus) => {
    const newStatus = currentStatus === PaymentMethodStatus.ACTIVE 
      ? PaymentMethodStatus.INACTIVE 
      : PaymentMethodStatus.ACTIVE;
      
    await handleApiOperation(
      () => PaymentService.updatePaymentMethodStatus(paymentMethodId, newStatus),
      `Payment method ${newStatus === PaymentMethodStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`
    );
  };

  const handleViewPaymentMethod = (paymentMethodId: string) => {
    router.push(`/payments/methods/${paymentMethodId}`);
  };

  const handleAddNewPaymentMethod = () => {
    router.push('/payments/methods/new');
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters as PaymentMethodFilterState);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedPaymentMethods([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedPaymentMethods([]);
  };

  // Table columns
  const columns = [
    {
      header: ({ table }: { table: any }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row, table }: { row: any; table: any }) => {
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
      id: 'selection'
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('brand')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Brand
          <span className="inline-flex">
            {sortBy === 'brand' ? (
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
      accessorKey: 'brand',
      cell: ({ row }: { row: any }) => (
        <div className="font-medium">{row.brand}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('type')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Type
          <span className="inline-flex">
            {sortBy === 'type' ? (
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
      accessorKey: 'type',
      cell: ({ row }: { row: any }) => (
        <div className="capitalize">
          {row.type === PaymentMethodType.CARD ? 'Card' : 'Bank Account'}
        </div>
      ),
    },
    {
      header: 'Last 4',
      accessorKey: 'last4',
      id: 'last4',
      cell: ({ row }: { row: any }) => (
        <div className="font-mono">•••• {row.last4}</div>
      ),
    },
    {
      header: 'Expiry',
      id: 'expiry',
      cell: ({ row }: { row: any }) => {
        const { expiryMonth, expiryYear, type } = row;
        return type === PaymentMethodType.CARD && expiryMonth && expiryYear
          ? <div>{expiryMonth}/{expiryYear}</div>
          : <div className="text-gray-400">-</div>;
      }
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
        <div className="capitalize">{row.provider}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('isDefault')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Default
          <span className="inline-flex">
            {sortBy === 'isDefault' ? (
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
      accessorKey: 'isDefault',
      cell: ({ row }: { row: any }) => (
        <div>
          {row.isDefault ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <button 
              onClick={() => handleSetDefault(row.id)}
              className="text-xs text-blue-600 hover:underline"
              disabled={isLoadingOperation || row.status === PaymentMethodStatus.INACTIVE}
            >
              Set Default
            </button>
          )}
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
      accessorKey: 'status',
      cell: ({ row }: { row: any }) => (
        <div>
          {row.status === PaymentMethodStatus.ACTIVE ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Inactive
            </span>
          )}
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('createdAt')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Added On
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
        <div className="text-sm">{formatDate(row.createdAt)}</div>
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
            onClick={() => handleViewPaymentMethod(row.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(
              row.id, 
              row.status
            )}
            disabled={isLoadingOperation}
          >
            {row.status === PaymentMethodStatus.ACTIVE ? (
              <X className="h-4 w-4 text-red-500" />
            ) : (
              <Check className="h-4 w-4 text-green-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            disabled={isLoadingOperation || row.isDefault}
          >
            <Trash2 className={`h-4 w-4 ${row.isDefault ? 'text-gray-300' : 'text-red-500'}`} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Payment Methods</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleAddNewPaymentMethod}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
          <Button 
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={selectedPaymentMethods.length === 0 || isLoadingOperation}
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
          columns={columns as any[]}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedPaymentMethods,
            onSelectedRowsChange: setSelectedPaymentMethods,
          }}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <CreditCard className="h-12 w-12 text-gray-400" />
              <div className="text-lg font-semibold text-gray-700">No payment methods found</div>
              <div className="text-sm text-gray-500">There are no payment methods matching your criteria.</div>
            </div>
          }
        />

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {data?.items?.length ? (page - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {data?.items?.length && data?.pagination?.total
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

          {data?.pagination?.total && data.pagination.total > pageSize && (
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