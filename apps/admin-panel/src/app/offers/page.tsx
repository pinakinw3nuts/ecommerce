'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { 
  Loader2, 
  Plus, 
  Trash2,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Tag,
  CheckSquare,
  Ban,
  Download,
  X,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { OfferFilters } from '@/components/offers/OfferFilters';
import Table from '@/components/Table';
import { useToast } from '@/hooks/useToast';
import { Column, TableInstance } from '@/components/Table';
import { CommonFilters, FilterConfig, FilterState } from '@/components/ui/CommonFilters';
import { useRouter } from 'next/navigation';

// Mock data for demonstration
const mockCoupons = Array.from({ length: 100 }, (_, i) => ({
  id: `coupon_${String(i + 1).padStart(3, '0')}`,
  code: [
    'SUMMER', 'WINTER', 'SPRING', 'FALL', 
    'WELCOME', 'SPECIAL', 'HOLIDAY', 'FLASH',
    'SAVE', 'DISCOUNT'
  ][Math.floor(Math.random() * 10)] + Math.floor(Math.random() * 90 + 10),
  type: ['flat', 'percent'][Math.floor(Math.random() * 2)] as 'flat' | 'percent',
  value: Math.floor(Math.random() * (
    // For percentage, max 70%. For flat amount, max $100
    ['flat', 'percent'][Math.floor(Math.random() * 2)] === 'percent' ? 70 : 100
  )) + 1,
  expiryDate: new Date(
    Date.now() + Math.floor(Math.random() * 31536000000) // Random date within next year
  ).toISOString().split('T')[0],
  usageCount: Math.floor(Math.random() * 200),
  isActive: Math.random() > 0.2, // 80% chance of being active
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  updatedAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString(),
}));

interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percent';
  value: number;
  expiryDate: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CouponsResponse {
  coupons: Coupon[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters'),
  type: z.enum(['flat', 'percent']),
  value: z.number().min(0, 'Value must be positive'),
  expiryDate: z.string(),
});

type CouponFormData = z.infer<typeof couponSchema>;

// Mock data fetcher that returns our mock data
const fetcher = async (url: string): Promise<CouponsResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Parse URL parameters
  const params = new URLSearchParams(url.split('?')[1]);
  const page = parseInt(params.get('page') || '1');
  const pageSize = parseInt(params.get('pageSize') || '10');
  const search = params.get('search') || '';
  const types = params.get('types')?.split(',') || [];
  const statuses = params.get('statuses')?.split(',') || [];
  const sortBy = params.get('sortBy') || 'createdAt';
  const sortOrder = params.get('sortOrder') || 'desc';
  const dateFrom = params.get('dateFrom');
  const dateTo = params.get('dateTo');
  const valueMin = params.get('valueMin');
  const valueMax = params.get('valueMax');

  // Filter coupons
  let filteredCoupons = [...mockCoupons];

  // Apply search filter
  if (search) {
    filteredCoupons = filteredCoupons.filter(coupon =>
      coupon.code.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Apply type filter
  if (types.length > 0) {
    filteredCoupons = filteredCoupons.filter(coupon =>
      types.includes(coupon.type)
    );
  }

  // Apply status filter
  if (statuses.length > 0) {
    filteredCoupons = filteredCoupons.filter(coupon =>
      statuses.includes(coupon.isActive ? 'active' : 'inactive')
    );
  }

  // Apply date filter
  if (dateFrom) {
    filteredCoupons = filteredCoupons.filter(coupon =>
      new Date(coupon.expiryDate) >= new Date(dateFrom)
    );
  }
  if (dateTo) {
    filteredCoupons = filteredCoupons.filter(coupon =>
      new Date(coupon.expiryDate) <= new Date(dateTo)
    );
  }

  // Apply value filter
  if (valueMin) {
    filteredCoupons = filteredCoupons.filter(coupon =>
      coupon.value >= Number(valueMin)
    );
  }
  if (valueMax) {
    filteredCoupons = filteredCoupons.filter(coupon =>
      coupon.value <= Number(valueMax)
    );
  }

  // Apply sorting
  filteredCoupons.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'code':
        comparison = a.code.localeCompare(b.code);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'value':
        comparison = a.value - b.value;
        break;
      case 'expiryDate':
        comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        break;
      case 'usageCount':
        comparison = a.usageCount - b.usageCount;
        break;
      default:
        comparison = a.id.localeCompare(b.id);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Apply pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedCoupons = filteredCoupons.slice(start, end);

  return {
    coupons: paginatedCoupons,
    pagination: {
      total: filteredCoupons.length,
      totalPages: Math.ceil(filteredCoupons.length / pageSize),
      currentPage: page,
      pageSize: pageSize,
      hasMore: end < filteredCoupons.length,
      hasPrevious: page > 1
    }
  };
};

type TableRow = {
  original: Coupon;
  table: TableInstance & {
    getRowProps: (row: Coupon) => {
      getIsSelected: () => boolean;
      getToggleSelectedHandler: () => () => void;
    };
  };
};

type CellProps = {
  row: Coupon;
  table: TableInstance & {
    getRowProps: (row: Coupon) => {
      getIsSelected: () => boolean;
      getToggleSelectedHandler: () => () => void;
    };
  };
};

interface OfferFilterState extends FilterState {
  status: string[];
  type: string[];
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
    placeholder: 'Search offers by code or description...',
  },
  filterGroups: [
    {
      name: 'Status',
      key: 'status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'expired', label: 'Expired' },
        { value: 'paused', label: 'Paused' },
      ],
    },
    {
      name: 'Type',
      key: 'type',
      options: [
        { value: 'percentage', label: 'Percentage' },
        { value: 'fixed', label: 'Fixed Amount' },
        { value: 'bogo', label: 'Buy One Get One' },
        { value: 'shipping', label: 'Free Shipping' },
      ],
    },
  ],
  hasDateRange: true,
  dateRangeLabel: 'Valid Period',
  hasValueRange: true,
  valueRangeLabel: 'Discount Value',
  valueRangeType: 'currency',
};

const initialFilters: OfferFilterState = {
  search: '',
  status: [],
  type: [],
  dateRange: { from: '', to: '' },
  valueRange: { min: '', max: '' },
};

export default function OffersPage() {
  const toast = useToast();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [filters, setFilters] = useState<OfferFilterState>(initialFilters);
  
  const getApiUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder,
    });

    if (filters.search) params.append('search', filters.search);
    if (filters.status.length) params.append('status', filters.status.join(','));
    if (filters.type.length) params.append('type', filters.type.join(','));
    if (filters.dateRange.from) params.append('dateFrom', filters.dateRange.from);
    if (filters.dateRange.to) params.append('dateTo', filters.dateRange.to);
    if (filters.valueRange.min) params.append('valueMin', filters.valueRange.min);
    if (filters.valueRange.max) params.append('valueMax', filters.valueRange.max);

    return `/api/coupons?${params.toString()}`;
  }, [page, pageSize, filters, sortBy, sortOrder]);

  const { data, error, mutate, isLoading } = useSWR<CouponsResponse>(
    getApiUrl(),
    fetcher
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
  });

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

  const handleCreateCoupon = async (formData: CouponFormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add new coupon to mock data
      const newCoupon: Coupon = {
        id: `coupon_${mockCoupons.length + 1}`.padStart(3, '0'),
        ...formData,
        usageCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockCoupons.unshift(newCoupon);
      
      await mutate();
      setIsCreating(false);
      reset();
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Failed to create coupon. Please try again.');
    }
  };

  const handleDeactivate = async (couponId: string) => {
    if (!confirm('Are you sure you want to deactivate this coupon?')) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update mock data
      const couponIndex = mockCoupons.findIndex(c => c.id === couponId);
      if (couponIndex !== -1) {
        mockCoupons[couponIndex].isActive = false;
      }
      
      await mutate();
    } catch (error) {
      console.error('Error deactivating coupon:', error);
      alert('Failed to deactivate coupon. Please try again.');
    }
  };

  const handleBulkDeactivate = async () => {
    if (!confirm(`Are you sure you want to deactivate ${selectedCoupons.length} coupons?`)) return;

    try {
      setIsLoadingOperation(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update mock data
      selectedCoupons.forEach(couponId => {
        const couponIndex = mockCoupons.findIndex(c => c.id === couponId);
        if (couponIndex !== -1) {
          mockCoupons[couponIndex].isActive = false;
        }
      });
      
      await mutate();
      setSelectedCoupons([]);
      toast.success(`Successfully deactivated ${selectedCoupons.length} coupons`);
    } catch (error) {
      console.error('Error deactivating coupons:', error);
      toast.error('Failed to deactivate coupons');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCoupons.length} coupons? This action cannot be undone.`)) return;

    try {
      setIsLoadingOperation(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update mock data
      selectedCoupons.forEach(couponId => {
        const couponIndex = mockCoupons.findIndex(c => c.id === couponId);
        if (couponIndex !== -1) {
          mockCoupons.splice(couponIndex, 1);
        }
      });
      
      await mutate();
      setSelectedCoupons([]);
      toast.success(`Successfully deleted ${selectedCoupons.length} coupons`);
    } catch (error) {
      console.error('Error deleting coupons:', error);
      toast.error('Failed to delete coupons');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters as OfferFilterState);
    setPage(1);
    setSelectedCoupons([]);
  };

  const handleFiltersReset = () => {
    setFilters({
      search: '',
      status: [],
      type: [],
      dateRange: { from: '', to: '' },
      valueRange: { min: '', max: '' },
    });
    setPage(1);
    setSelectedCoupons([]);
  };

  const columns: Column<Coupon>[] = [
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
          <span className="inline-flex">{getSortIcon('code')}</span>
        </button>
      ),
      accessorKey: 'code',
      cell: ({ row }: { row: Coupon }) => (
        <div className="font-medium text-gray-900">{row.code}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('type')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Type
          <span className="inline-flex">{getSortIcon('type')}</span>
        </button>
      ),
      accessorKey: 'type',
      cell: ({ row }: { row: Coupon }) => (
        <div className="capitalize">{row.type}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('value')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Value
          <span className="inline-flex">{getSortIcon('value')}</span>
        </button>
      ),
      accessorKey: 'value',
      cell: ({ row }: { row: Coupon }) => (
        <div>
          {row.type === 'percent' 
            ? `${row.value}%` 
            : `$${row.value.toFixed(2)}`}
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('expiryDate')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Expiry
          <span className="inline-flex">{getSortIcon('expiryDate')}</span>
        </button>
      ),
      accessorKey: 'expiryDate',
      cell: ({ row }: { row: Coupon }) => (
        <div>{format(new Date(row.expiryDate), 'PP')}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('usageCount')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Usage Count
          <span className="inline-flex">{getSortIcon('usageCount')}</span>
        </button>
      ),
      accessorKey: 'usageCount',
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('isActive')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Status
          <span className="inline-flex">{getSortIcon('isActive')}</span>
        </button>
      ),
      accessorKey: 'isActive',
      cell: ({ row }: { row: Coupon }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: Coupon }) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDeactivate(row.id)}
          disabled={!row.isActive || isLoadingOperation}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Deactivate
        </Button>
      ),
    },
  ];

  const hasActiveFilters = 
    filters.search ||
    filters.status.length > 0 ||
    filters.type.length > 0 ||
    filters.dateRange.from ||
    filters.dateRange.to ||
    filters.valueRange.min ||
    filters.valueRange.max;

  // Build query string from filters
  const queryString = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(filters.search && { search: filters.search }),
    ...(filters.status.length && { status: filters.status.join(',') }),
    ...(filters.type.length && { type: filters.type.join(',') }),
    ...(filters.dateRange.from && { fromDate: filters.dateRange.from }),
    ...(filters.dateRange.to && { toDate: filters.dateRange.to }),
    ...(filters.valueRange.min && { minValue: filters.valueRange.min }),
    ...(filters.valueRange.max && { maxValue: filters.valueRange.max }),
    sortBy,
    sortOrder,
  }).toString();

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load coupons</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Promotional Offers</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/offers/new')}
            disabled={isLoadingOperation}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Offer
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/offers/export')}
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
      {selectedCoupons.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedCoupons.length} {selectedCoupons.length === 1 ? 'coupon' : 'coupons'} selected
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

      {/* Table */}
      <div className="rounded-lg border border-gray-200">
        <Table
          data={data?.coupons || []}
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
                {data ? (page - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {data
                  ? Math.min(page * pageSize, data.pagination?.total || 0)
                  : 0}
              </span>{' '}
              of{' '}
              <span className="font-medium">{data?.pagination?.total || 0}</span>{' '}
              results
            </p>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
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
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      {/* Create Coupon Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create New Coupon</h2>
            
            <form onSubmit={handleSubmit(handleCreateCoupon)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Coupon Code
                </label>
                <input
                  type="text"
                  {...register('code')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="SUMMER2024"
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  {...register('type')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="flat">Flat Amount</option>
                  <option value="percent">Percentage</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Value
                </label>
                <input
                  type="number"
                  {...register('value', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="10"
                />
                {errors.value && (
                  <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  {...register('expiryDate')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.expiryDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Coupon
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 