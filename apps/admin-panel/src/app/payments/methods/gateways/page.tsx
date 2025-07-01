'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  CreditCard,
  Trash2,
  Eye,
  Settings,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Table from '@/components/Table';
import { toast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, type FilterState, type FilterConfig } from '@/components/ui/CommonFilters';
import { 
  PaymentService,
  PaymentGatewayListParams,
} from '@/services/payment.service';
import { 
  PaymentGateway, 
  PaymentGatewayType,
  PaymentGatewaysResponse,
} from '@/types/payment';

// Filter configuration
const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search gateways...'
  },
  enabled: {
    type: 'boolean',
    placeholder: 'Status',
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
  },
  type: {
    type: 'select',
    placeholder: 'Gateway Type',
    options: [
      { value: PaymentGatewayType.DIRECT, label: 'Direct' },
      { value: PaymentGatewayType.REDIRECT, label: 'Redirect' },
      { value: PaymentGatewayType.IFRAME, label: 'iFrame' },
      { value: PaymentGatewayType.OFFLINE, label: 'Offline' },
    ],
  },
};

// Filter state interface
interface PaymentGatewayFilterState extends FilterState {
  enabled: string[];
  type: string[];
}

const initialFilters: PaymentGatewayFilterState = {
  search: '',
  enabled: [],
  type: [],
};

export default function PaymentGatewaysPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedGateways, setSelectedGateways] = useState<string[]>([]);
  const [filters, setFilters] = useState<PaymentGatewayFilterState>(initialFilters);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PaymentGatewaysResponse | null>(null);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [hasError, setHasError] = useState(false);
  const [errorRetryCount, setErrorRetryCount] = useState(0);
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
    setSelectedGateways([]);
  }, []);

  // Build API parameters with current filters
  const getApiParams = useMemo(() => {
    return (): PaymentGatewayListParams => {
      const params: PaymentGatewayListParams = {
        page,
        pageSize,
        sortBy,
        sortOrder,
      };
      if (debouncedFilters.search) {
        params.search = debouncedFilters.search.toString();
      }
      if (debouncedFilters.enabled.length === 1) {
        params.enabled = debouncedFilters.enabled[0] === 'true';
      }
      if (debouncedFilters.type.length > 0) {
        params.type = debouncedFilters.type;
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
        const result = await PaymentService.getPaymentGateways(params);
        setData(result);
      } catch (error) {
        setHasError(true);
        setErrorRetryCount((prev) => prev + 1);
        console.error('Failed to fetch initial payment gateways:', error);
        toast.error('Failed to load payment gateways');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Main fetch effect for filter changes
  useEffect(() => {
    let isMounted = true;
    if (JSON.stringify(previousFilters.current) === JSON.stringify(debouncedFilters)) {
      return;
    }
    previousFilters.current = debouncedFilters;
    const fetchData = async () => {
      if (hasError && errorRetryCount > 2) {
        return;
      }
      setIsLoading(true);
      try {
        const params = getApiParams();
        const result = await PaymentService.getPaymentGateways(params);
        if (isMounted) {
          setData(result);
          setHasError(false);
          setErrorRetryCount(0);
        }
      } catch (error) {
        setHasError(true);
        setErrorRetryCount((prev) => prev + 1);
        console.error('Failed to fetch payment gateways:', error);
        toast.error('Failed to load payment gateways');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [debouncedFilters, getApiParams, hasError, errorRetryCount]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    const updatedFilters: PaymentGatewayFilterState = {
      search: typeof newFilters.search === 'string' ? newFilters.search : '',
      enabled: Array.isArray(newFilters.enabled) ? newFilters.enabled : [],
      type: Array.isArray(newFilters.type) ? newFilters.type : [],
    };
    setFilters(updatedFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleAddNewGateway = () => {
    router.push('/payments/methods/gateways/new');
  };

  const handleViewGateway = (id: string) => {
    router.push(`/payments/methods/gateways/${id}`);
  };

  const handleEditGateway = (id: string) => {
    router.push(`/payments/methods/gateways/${id}/edit`);
  };

  const handleToggleStatus = async (id: string, isEnabled: boolean) => {
    try {
      setIsLoadingOperation(true);
      await PaymentService.togglePaymentGatewayStatus(id, !isEnabled);
      // Fetch updated data
      const params = getApiParams();
      const result = await PaymentService.getPaymentGateways(params);
      setData(result);
      toast.success(`Gateway ${!isEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      // Handle authentication errors
      if (error?.response?.status === 401) {
        // Redirect to login page with return URL
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnUrl=${returnUrl}`;
        return;
      }
      // Handle other errors
      console.error('Failed to toggle gateway status:', error);
      toast.error(error.message || 'Failed to update gateway status');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleDeleteGateway = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gateway?')) {
      return;
    }
    try {
      setIsLoadingOperation(true);
      await PaymentService.deletePaymentGateway(id);
      // Fetch updated data
      const params = getApiParams();
      const result = await PaymentService.getPaymentGateways(params);
      setData(result);
      toast.success('Gateway deleted successfully');
      setSelectedGateways(selectedGateways.filter(gId => gId !== id));
    } catch (error: any) {
      // Handle authentication errors
      if (error?.response?.status === 401) {
        // Redirect to login page with return URL
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnUrl=${returnUrl}`;
        return;
      }
      // Handle other errors
      console.error('Failed to delete gateway:', error);
      toast.error(error.message || 'Failed to delete gateway');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGateways.length === 0) {
      toast.error('No gateways selected');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedGateways.length} gateways?`)) {
      return;
    }
    try {
      setIsLoadingOperation(true);
      await Promise.all(selectedGateways.map(id => PaymentService.deletePaymentGateway(id)));
      // Fetch updated data
      const params = getApiParams();
      const result = await PaymentService.getPaymentGateways(params);
      setData(result);
      toast.success(`${selectedGateways.length} gateways deleted successfully`);
      setSelectedGateways([]);
    } catch (error: any) {
      // Handle authentication errors
      if (error?.response?.status === 401) {
        // Redirect to login page with return URL
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnUrl=${returnUrl}`;
        return;
      }
      // Handle other errors
      console.error('Failed to delete gateways:', error);
      toast.error(error.message || 'Failed to delete gateways');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedGateways([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedGateways([]);
  };

  const columns = [
    {
      header: () => (
        <button
          onClick={() => handleSort('name')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Name
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
      accessorKey: 'name',
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
        <div className="capitalize">{row.type}</div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isEnabled',
      cell: ({ row }: { row: any }) => (
        <div>
          {row.isEnabled ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Enabled
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Disabled
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Last Updated',
      accessorKey: 'updatedAt',
      cell: ({ row }: { row: any }) => (
        <div>{formatDate(row.updatedAt)}</div>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewGateway(row.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditGateway(row.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(row.id, row.isEnabled)}
            disabled={isLoadingOperation}
          >
            {row.isEnabled ? (
              <X className="h-4 w-4 text-red-500" />
            ) : (
              <Check className="h-4 w-4 text-green-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteGateway(row.id)}
            disabled={isLoadingOperation}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Payment Gateways</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleAddNewGateway}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Gateway
          </Button>
          <Button 
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={selectedGateways.length === 0 || isLoadingOperation}
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
      <Table
        data={data?.items || []}
        columns={columns as any[]}
        isLoading={isLoading}
        selection={{
          selectedRows: selectedGateways,
          onSelectedRowsChange: setSelectedGateways,
        }}
        emptyState={
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Settings className="h-12 w-12 text-gray-400" />
            <div className="text-lg font-semibold text-gray-700">No payment gateways found</div>
            <div className="text-sm text-gray-500">There are no payment gateways matching your criteria.</div>
          </div>
        }
      />

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={data.total}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
} 