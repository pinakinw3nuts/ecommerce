'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, Edit, Trash2, Download, ChevronUp, ChevronDown, ChevronsUpDown, Eye, Tag } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import Table, { type Column, type TableInstance } from '@/components/Table';
import { Pagination } from '@/components/ui/Pagination';
import { shippingApi } from '@/lib/shipping-api-client';
import { ShippingRate, PaginationOptions, ShippingRateFilters, ShippingRatesResponse } from '@/types/shipping';
import { CommonFilters, type FilterState, type FilterConfig } from '@/components/ui/CommonFilters';

const PAGE_SIZES = [10, 25, 50, 100];

const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search rates by name...'
  },
  isActive: {
    type: 'boolean',
    placeholder: 'Status',
    options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ],
  },
};

const initialFilters: FilterState = {
  search: '',
  isActive: [],
};

const fetcher = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch shipping rates');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export default function ShippingRatesPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRates, setSelectedRates] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Fetch all shipping methods and zones for dropdowns
  const { data: methodsData } = useSWR('shippingMethods', () => shippingApi.listShippingMethods({}, { page: 1, limit: 100 }));
  const { data: zonesData } = useSWR('shippingZones', () => shippingApi.listShippingZones({}, { page: 1, limit: 100 }));

  // Add method/zone filters to filterConfig dynamically
  const methodOptions = methodsData?.methods?.map(m => ({ value: m.id, label: m.name })) || [];
  const zoneOptions = zonesData?.zones?.map(z => ({ value: z.id, label: z.name })) || [];
  const fullFilterConfig = {
    ...filterConfig,
    shippingMethodId: {
      type: 'select' as const,
      placeholder: 'Filter by method',
      options: methodOptions,
    },
    shippingZoneId: {
      type: 'select' as const,
      placeholder: 'Filter by zone',
      options: zoneOptions,
    },
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
    setSelectedRates([]);
  }, []);

  const getApiUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      order: sortOrder.toUpperCase(),
    });
    if (debouncedFilters.search) {
      const searchTerm = (debouncedFilters.search as string).trim();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
    }
    if (Array.isArray(debouncedFilters.isActive) && debouncedFilters.isActive.length > 0) {
      params.append('isActive', debouncedFilters.isActive[0]);
    }
    if (Array.isArray(debouncedFilters.shippingMethodId) && debouncedFilters.shippingMethodId.length > 0) {
      params.append('shippingMethodId', debouncedFilters.shippingMethodId[0]);
    }
    if (Array.isArray(debouncedFilters.shippingZoneId) && debouncedFilters.shippingZoneId.length > 0) {
      params.append('shippingZoneId', debouncedFilters.shippingZoneId[0]);
    }
    return `/api/shipping/rates?${params.toString()}`;
  }, [page, pageSize, debouncedFilters, sortBy, sortOrder]);

  const { data, error, isLoading, mutate } = useSWR<ShippingRatesResponse>(
    getApiUrl(),
    fetcher,
    {
      onError: (err) => {
        toast.error('Failed to load shipping rates');
      }
    }
  );

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleApiOperation = async (operation: () => Promise<Response>, successMessage: string) => {
    try {
      setIsLoadingOperation(true);
      const response = await operation();
      if (!response.ok) throw new Error(`Failed to ${successMessage.toLowerCase()}`);
      toast.success(successMessage);
      mutate();
      return true;
    } catch (error) {
      toast.error(`Failed to ${successMessage.toLowerCase()}`);
      return false;
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleDelete = async (rateId: string) => {
    if (!confirm('Are you sure you want to delete this shipping rate?')) return;
    const success = await handleApiOperation(
      () => fetch(`/api/shipping/rates/${rateId}`, { method: 'DELETE' }),
      'Shipping rate deleted successfully'
    );
    if (success) {
      setSelectedRates(prev => prev.filter(id => id !== rateId));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRates.length} shipping rates?`)) return;
    const success = await handleApiOperation(
      () => fetch('/api/shipping/rates/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rateIds: selectedRates }),
      }),
      `${selectedRates.length} shipping rates deleted successfully`
    );
    if (success) {
      setSelectedRates([]);
    }
  };

  const handleExport = () => {
    // Implement export logic as needed (CSV, Excel, etc.)
    toast.success('Exported shipping rates!');
  };

  // Map method/zone IDs to names for table display
  const methodMap = Object.fromEntries((methodsData?.methods || []).map(m => [m.id, m.name]));
  const zoneMap = Object.fromEntries((zonesData?.zones || []).map(z => [z.id, z.name]));

  // Table columns matching attribute page style
  const columns = [
    {
      header: () => (
        <input
          type="checkbox"
          checked={Boolean(data && data.rates && data.rates.length > 0 && selectedRates.length === data.rates.length)}
          onChange={e => {
            if (e.target.checked && data && data.rates) {
              setSelectedRates(data.rates.map(r => r.id));
            } else {
              setSelectedRates([]);
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row }: { row: ShippingRate }) => (
        <input
          type="checkbox"
          checked={selectedRates.includes(row.id)}
          onChange={e => {
            if (e.target.checked) {
              setSelectedRates(prev => [...prev, row.id]);
            } else {
              setSelectedRates(prev => prev.filter(id => id !== row.id));
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      header: () => (
        <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-blue-600">
          Name
          <span className="inline-flex">
            {sortBy === 'name' ? (
              sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </button>
      ),
      cell: ({ row }: { row: ShippingRate }) => (
        <div className="flex items-center">
          <Tag className="h-4 w-4 mr-2 text-blue-500" />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: () => (
        <button onClick={() => handleSort('rate')} className="flex items-center gap-1 hover:text-blue-600">
          Rate
          <span className="inline-flex">
            {sortBy === 'rate' ? (
              sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </button>
      ),
      cell: ({ row }: { row: ShippingRate }) => {
        const rate = typeof row.rate === 'string' ? parseFloat(row.rate) : row.rate;
        return `$${rate.toFixed(2)}`;
      },
      sortable: true,
    },
    {
      header: 'Method',
      cell: ({ row }: { row: ShippingRate }) => methodMap[row.shippingMethodId] || row.shippingMethodId,
    },
    {
      header: 'Zone',
      cell: ({ row }: { row: ShippingRate }) => zoneMap[row.shippingZoneId] || row.shippingZoneId,
    },
    {
      header: () => (
        <button onClick={() => handleSort('estimatedDays')} className="flex items-center gap-1 hover:text-blue-600">
          Estimated Days
          <span className="inline-flex">
            {sortBy === 'estimatedDays' ? (
              sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </button>
      ),
      cell: ({ row }: { row: ShippingRate }) => row.estimatedDays,
      sortable: true,
    },
    {
      header: 'Status',
      cell: ({ row }: { row: ShippingRate }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{row.isActive ? 'Active' : 'Inactive'}</span>
      ),
    },
    {
      header: () => (
        <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-blue-600">
          Created At
          <span className="inline-flex">
            {sortBy === 'createdAt' ? (
              sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </button>
      ),
      cell: ({ row }: { row: ShippingRate }) => <span className="text-sm text-gray-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</span>,
      sortable: true,
    },
    {
      header: () => (
        <button onClick={() => handleSort('updatedAt')} className="flex items-center gap-1 hover:text-blue-600">
          Updated At
          <span className="inline-flex">
            {sortBy === 'updatedAt' ? (
              sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </button>
      ),
      cell: ({ row }: { row: ShippingRate }) => <span className="text-sm text-gray-500">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-'}</span>,
      sortable: true,
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: ShippingRate }) => (
        <div className="space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.push(`/shipping/rates/${row.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => router.push(`/shipping/rates/${row.id}/edit`)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={() => handleDelete(row.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Shipping Rates</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoadingOperation}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={() => router.push('/shipping/rates/new')} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Rate
          </Button>
        </div>
      </div>

      <CommonFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        config={fullFilterConfig}
      />

      {selectedRates.length > 0 && (
        <div className="flex items-center gap-4 py-4">
          <span className="text-sm text-gray-600">{selectedRates.length} items selected</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkDelete} disabled={isLoadingOperation}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {error && <p className="text-red-500">Failed to load data.</p>}
        <Table columns={columns} data={data?.rates || []} isLoading={isLoading} />
        {data && data.rates && data.pagination && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{data.rates.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to <span className="font-medium">{data.rates.length > 0 ? Math.min(page * pageSize, data.pagination.total) : 0}</span> of <span className="font-medium">{data.pagination.total || 0}</span> results
              </p>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PAGE_SIZES.map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={data.pagination.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
} 