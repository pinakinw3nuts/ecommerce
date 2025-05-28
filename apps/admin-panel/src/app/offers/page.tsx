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
  Tag,
  Ban,
} from 'lucide-react';
import Table from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { TableInstance } from '@/components/Table';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, type FilterState, type FilterConfig, type DateRangeFilter, type RangeFilter } from '@/components/ui/CommonFilters';
import { Coupon, CouponListParams, CouponListingResponse } from '@/types/coupon';
import { offerApi } from '@/lib/offer-api-client';

const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search coupons...',
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
      { value: 'flat', label: 'Fixed Amount' },
      { value: 'percent', label: 'Percentage' },
    ],
  },
  dateRange: {
    type: 'daterange',
    placeholder: 'Filter by expiry date',
  },
  valueRange: {
    type: 'valueRange',
    placeholder: 'Filter by value',
  },
};

const initialFilters: FilterState = {
  search: '',
  status: [],
  type: [],
  dateRange: { from: '', to: '' } as DateRangeFilter,
  valueRange: { min: '', max: '' } as RangeFilter,
};

// Fetcher function for SWR
const fetcher = async (url: string) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      throw new Error(error.message || 'Failed to fetch coupons');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in fetcher:', error);
    throw error;
  }
};

export default function OffersPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
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
    setSelectedCoupons([]);
  }, []);

  const getApiUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder,
      skip: ((page - 1) * pageSize).toString(),
      take: pageSize.toString()
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

    if ((debouncedFilters.type as string[])?.length) {
      params.append('type', (debouncedFilters.type as string[]).join(','));
    }

    const dateRange = debouncedFilters.dateRange as DateRangeFilter;
    if (dateRange?.from) {
      params.append('dateFrom', dateRange.from);
    }

    if (dateRange?.to) {
      params.append('dateTo', dateRange.to);
    }

    const valueRange = debouncedFilters.valueRange as RangeFilter;
    if (valueRange?.min) {
      params.append('valueMin', valueRange.min);
    }

    if (valueRange?.max) {
      params.append('valueMax', valueRange.max);
    }

    return `/api/coupons?${params.toString()}`;
  }, [page, pageSize, debouncedFilters, sortBy, sortOrder]);

  const { data, error, isLoading, mutate } = useSWR<CouponListingResponse>(
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

  const handleApiOperation = async (operation: () => Promise<any>, successMessage: string) => {
    try {
      setIsLoadingOperation(true);
      await operation();
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

  const handleDeactivate = async (couponId: string) => {
    if (!confirm('Are you sure you want to deactivate this coupon?')) return;
    
    await handleApiOperation(
      async () => {
        await offerApi.updateCoupon(couponId, { isActive: false });
        return true;
      },
      'Coupon deactivated successfully'
    );
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    const success = await handleApiOperation(
      async () => {
        await offerApi.deleteCoupon(couponId);
        return true;
      },
      'Coupon deleted successfully'
    );
    
    if (success) {
      setSelectedCoupons(prev => prev.filter(id => id !== couponId));
    }
  };

  const handleBulkDeactivate = async () => {
    if (!selectedCoupons.length) return;
    if (!confirm(`Are you sure you want to deactivate ${selectedCoupons.length} coupons?`)) return;
    
    const success = await handleApiOperation(
      async () => {
        await offerApi.bulkDeactivateCoupons(selectedCoupons);
        return true;
      },
      `${selectedCoupons.length} coupons deactivated successfully`
    );
    
    if (success) {
      setSelectedCoupons([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedCoupons.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedCoupons.length} coupons?`)) return;
    
    const success = await handleApiOperation(
      async () => {
        await offerApi.bulkDeleteCoupons(selectedCoupons);
        return true;
      },
      `${selectedCoupons.length} coupons deleted successfully`
    );
    
    if (success) {
      setSelectedCoupons([]);
    }
  };

  const handleExport = () => {
    // This would be implemented with actual export functionality
    toast.success('Export feature not implemented yet');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedCoupons([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedCoupons([]);
  };

  const formatDiscountValue = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountAmount}%`;
    } else {
      return `$${coupon.discountAmount.toFixed(2)}`;
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
      cell: ({ row, table }: { row: Coupon; table: TableInstance & { getRowProps: (row: Coupon) => { getIsSelected: () => boolean; getToggleSelectedHandler: () => () => void } } }) => {
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
          onClick={() => handleSort('code')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Code
          <span className="inline-flex">
            {sortBy === 'code' ? (
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
      cell: ({ row }: { row: Coupon }) => (
        <div className="font-medium">{row.code}</div>
      ),
    },
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
      cell: ({ row }: { row: Coupon }) => (
        <span>{row.name}</span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('discountAmount')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Discount
          <span className="inline-flex">
            {sortBy === 'discountAmount' ? (
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
      cell: ({ row }: { row: Coupon }) => (
        <span>{formatDiscountValue(row)}</span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('endDate')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Expiry Date
          <span className="inline-flex">
            {sortBy === 'endDate' ? (
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
      cell: ({ row }: { row: Coupon }) => (
        <span className="text-sm text-gray-500">
          {formatDate(row.endDate)}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('usageCount')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Usage
          <span className="inline-flex">
            {sortBy === 'usageCount' ? (
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
      cell: ({ row }: { row: Coupon }) => (
        <span>
          {row.usageCount}
          {row.usageLimit ? ` / ${row.usageLimit}` : ''}
        </span>
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
      cell: ({ row }: { row: Coupon }) => (
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
      header: 'Actions',
      cell: ({ row }: { row: Coupon }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/offers/edit/${row.id}`)}
            disabled={isLoadingOperation}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {row.isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeactivate(row.id)}
              disabled={isLoadingOperation}
            >
              <Ban className="h-4 w-4" />
            </Button>
          )}
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
        <p className="text-red-600 font-medium">Failed to load coupons</p>
        <p className="text-red-500 text-sm mt-1">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => {
            mutate();
          }}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tag className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-semibold">Promotional Offers</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={true}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => router.push('/offers/new')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Offer
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500">Loading coupons...</p>
        </div>
      </div>
    );
  }

  // Add check for unexpected data structure
  if (!data.coupons || !Array.isArray(data.coupons)) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-yellow-600 font-medium">Data format issue</p>
        <p className="text-yellow-500 text-sm mt-1">
          The API returned data in an unexpected format. 
          {data ? ` Received: ${JSON.stringify(data).substring(0, 100)}...` : ' No data received.'}
        </p>
        <button
          onClick={() => {
            mutate();
          }}
          className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Tag className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold">Promotional Offers</h1>
        </div>
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
          <Button onClick={() => router.push('/offers/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Offer
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
      {selectedCoupons.length > 0 && (
        <div className="flex items-center gap-4 py-4">
          <span className="text-sm text-gray-600">
            {selectedCoupons.length} items selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDeactivate}
              disabled={isLoadingOperation}
            >
              <Ban className="h-4 w-4 mr-2" />
              Deactivate Selected
            </Button>
            <Button
              variant="destructive"
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

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          data={data.coupons}
          columns={columns}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedCoupons,
            onSelectedRowsChange: setSelectedCoupons,
          }}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {data.pagination?.total ? (page - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {data.pagination?.total
                  ? Math.min(page * pageSize, data.pagination.total)
                  : 0}
              </span>{' '}
              of{' '}
              <span className="font-medium">{data.pagination?.total || 0}</span>{' '}
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
            totalItems={data.pagination?.total || 0}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
} 