'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  Filter,
  Search,
  Percent
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
    placeholder: 'Search coupons by name or code...',
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
    console.log(`Fetching coupons from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        console.log('Unauthorized access, redirecting to login');
        window.location.href = '/login';
        return;
      }
      throw new Error(error.message || 'Failed to fetch coupons');
    }
    
    const data = await response.json();
    console.log('Successfully fetched coupons data:', {
      couponsCount: data.coupons?.length,
      pagination: data.pagination,
    });
    
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
    // Store the currently focused element before filter update
    const activeElement = document.activeElement;
    const activeElementType = activeElement ? (activeElement as HTMLElement).getAttribute('data-input-type') : null;
    
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      
      // After state update, restore focus if it was on a value input
      if (activeElementType === 'valueRange' && activeElement) {
        setTimeout(() => {
          (activeElement as HTMLElement).focus();
        }, 0);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [filters]);

  const getApiUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder: sortOrder.toUpperCase(),
    });

    // Process text search
    if (debouncedFilters.search) {
      const searchTerm = String(debouncedFilters.search).trim();
      if (searchTerm) {
        params.append('search', searchTerm);
        console.log(`Adding search parameter: "${searchTerm}"`);
      }
    }
    
    // Process status filter
    if ((debouncedFilters.status as string[])?.length) {
      params.append('status', (debouncedFilters.status as string[]).join(','));
      console.log(`Adding status filter: ${(debouncedFilters.status as string[]).join(',')}`);
    }

    // Process type filter
    if ((debouncedFilters.type as string[])?.length) {
      params.append('type', (debouncedFilters.type as string[]).join(','));
      console.log(`Adding type filter: ${(debouncedFilters.type as string[]).join(',')}`);
    }

    // Process date range filters
    const dateRange = debouncedFilters.dateRange as DateRangeFilter;
    if (dateRange?.from) {
      params.append('dateFrom', dateRange.from);
      console.log(`Adding date from: ${dateRange.from}`);
    }
    if (dateRange?.to) {
      params.append('dateTo', dateRange.to);
      console.log(`Adding date to: ${dateRange.to}`);
    }

    // Process value range filters
    const valueRange = debouncedFilters.valueRange as RangeFilter;
    if (valueRange?.min) {
      params.append('minValue', valueRange.min);
      console.log(`Adding value min: ${valueRange.min}`);
    }
    if (valueRange?.max) {
      params.append('maxValue', valueRange.max);
      console.log(`Adding value max: ${valueRange.max}`);
    }

    console.log(`Full request URL: /api/admin/coupons?${params.toString()}`);
    return `/api/admin/coupons?${params.toString()}`;
  }, [page, pageSize, debouncedFilters, sortBy, sortOrder]);

  // Create a key for SWR that changes when pagination, sorting, or filters change
  const swr_key = `coupons?${new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sortBy,
    sortOrder,
    filters: JSON.stringify(debouncedFilters),
  }).toString()}`;

  const { data, error, isLoading, mutate } = useSWR<CouponListingResponse>(
    swr_key,
    () => fetcher(getApiUrl()),
    {
      keepPreviousData: false,
      revalidateOnFocus: false,
    }
  );
  
  const resetFilters = useCallback(() => {
    console.log('Resetting all filters');
    setFilters(initialFilters);
    setPage(1);
    setSelectedCoupons([]);
    // Force a data refresh
    mutate();
  }, [mutate, setFilters, setPage, setSelectedCoupons]);

  // Add effect for client-side sorting
  useEffect(() => {
    // Only apply client-side sorting for special columns when data is available
    if (data?.coupons && data.coupons.length > 0 && 
        sortBy === 'isActive') {
      console.log(`Applying client-side sorting for ${sortBy}`);
      
      const sortedCoupons = [...data.coupons].sort((a, b) => {
        if (sortBy === 'isActive') {
          // For boolean values, true comes before false in ascending order
          const aValue = a.isActive ? 1 : 0;
          const bValue = b.isActive ? 1 : 0;
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
      
      // Update the data with sorted coupons without triggering a refetch
      mutate({
        coupons: sortedCoupons,
        pagination: data.pagination
      }, false);
    }
  }, [data, sortBy, sortOrder]);

  const handleSort = (column: string) => {
    // Only allow sorting by fields supported by the backend API
    const allowedSortFields = ['code', 'name', 'discountAmount', 'endDate', 'usageCount', 'createdAt'];
    
    // Handle special case for client-side sorting
    if (column === 'isActive') {
      console.log(`Sorting by ${column} using client-side sorting`);
      
      // Toggle sort order if already sorting by this column
      if (sortBy === column) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(column);
        setSortOrder('asc');
      }
      
      // Apply client-side sorting if we have data
      if (data?.coupons && data.coupons.length > 0) {
        const sortedCoupons = [...data.coupons].sort((a, b) => {
          if (column === 'isActive') {
            // For boolean values, true comes before false in ascending order
            const aValue = a.isActive ? 1 : 0;
            const bValue = b.isActive ? 1 : 0;
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          }
          return 0;
        });
        
        // Update the data with sorted coupons
        mutate({
          coupons: sortedCoupons,
          pagination: data.pagination
        }, false); // false means don't revalidate with the server
      }
    } else if (!allowedSortFields.includes(column)) {
      console.log(`Sorting by ${column} is not supported by the API. Using createdAt instead.`);
      if (sortBy === 'createdAt') {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy('createdAt');
        setSortOrder('asc');
      }
    } else if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page when sorting changes
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
    console.log(`Changing page from ${page} to ${newPage}`);
    
    // Only change if it's actually a different page
    if (newPage !== page) {
      // Clear selections when changing pages
      setSelectedCoupons([]);
      
      // Update the page state
      setPage(newPage);
      
      // Force a refresh of the data
      const newUrl = getApiUrl();
      console.log(`New API URL after page change: ${newUrl}`);
      
      // Force a data refresh when changing pages
      setTimeout(() => {
        mutate();
      }, 0);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    console.log(`Changing page size from ${pageSize} to ${newSize}`);
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
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
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
            {row.discountType === 'PERCENTAGE' ? <Percent className="h-3 w-3 mr-1" /> : <Tag className="h-3 w-3 mr-1" />}
            {formatDiscountValue(row)}
          </span>
        </div>
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
    console.error('Rendering error state:', error);
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600 font-medium">Failed to load coupons</p>
        <p className="text-red-500 text-sm mt-1">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => {
            console.log('Retrying coupons fetch...');
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