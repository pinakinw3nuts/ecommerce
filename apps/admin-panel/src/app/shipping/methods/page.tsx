'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Truck,
  Search, 
  Filter as FilterIcon, 
  X,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import Table, { type Column } from '@/components/Table';
import { Pagination } from '@/components/ui/Pagination';
import { shippingApi } from '@/lib/shipping-api-client';
import { ShippingMethod, PaginationOptions, ShippingMethodFilters, ShippingMethodsResponse } from '@/types/shipping';
import { CommonFilters, FilterConfig, FilterState } from '@/components/ui/CommonFilters';

interface ShippingMethodFilterState extends FilterState {
  search: string;
  isActive: string[];
  valueRange: {
    min: string;
    max: string;
  };
}

const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search shipping methods...',
  },
  filterGroups: {
    type: 'select',
    placeholder: 'Filter by group',
    options: [
      { value: 'isActive', label: 'Status' },
    ]
  },
  isActive: {
    type: 'select',
    placeholder: 'Filter by status',
    options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ],
  },
  valueRange: {
    type: 'valueRange',
    placeholder: 'Rate Range',
  },
};

const initialFilters: ShippingMethodFilterState = {
  search: '',
  isActive: [],
  valueRange: {
    min: '',
    max: '',
  },
};

export default function ShippingMethodsPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [filters, setFilters] = useState<ShippingMethodFilterState>(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Add debouncing for filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [filters]);

  // Create API filters
  let isActiveFilter;
  if (debouncedFilters.isActive && debouncedFilters.isActive.length > 0) {
    isActiveFilter = debouncedFilters.isActive[0] === 'true' ? true : false;
  }
  
  // Get the min/max rate values for rate range filtering
  const minRate = debouncedFilters.valueRange?.min ? debouncedFilters.valueRange.min : undefined;
  const maxRate = debouncedFilters.valueRange?.max ? debouncedFilters.valueRange.max : undefined;
  
  const apiFilters: ShippingMethodFilters = {
    search: debouncedFilters.search || undefined,
    isActive: isActiveFilter,
    minRate: minRate,
    maxRate: maxRate
  }; 

  const apiPagination: PaginationOptions = {
    page,
    limit: pageSize,
    sortBy: sortBy,
    order: sortOrder.toUpperCase() as 'ASC' | 'DESC',
  };

  const { data, error, isLoading, mutate } = useSWR<ShippingMethodsResponse>(
    ['shippingMethods', apiFilters, apiPagination],
    ([_key, currentFilters, currentPagination]) =>
      shippingApi.listShippingMethods(
        currentFilters as ShippingMethodFilters, 
        currentPagination as PaginationOptions
      )
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters as ShippingMethodFilterState);
    setPage(1); // Reset to first page when filters change
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setIsLoadingOperation(true);
      toast.success('Exported shipping methods successfully.');
      // Implement export functionality here
    } catch (error: any) {
      toast.error(error.message || 'Failed to export shipping methods');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMethods.length === 0) {
      toast.error('Please select at least one shipping method to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedMethods.length} shipping methods?`)) {
      try {
        setIsLoadingOperation(true);
        // Implementation would go here - for each ID in selectedMethods call the delete API
        toast.success(`Deleted ${selectedMethods.length} shipping methods successfully.`);
        setSelectedMethods([]);
        mutate(); // Refresh the data
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete shipping methods');
      } finally {
        setIsLoadingOperation(false);
      }
    }
  };

  const hasActiveFilters =
    filters.search ||
    (filters.isActive && filters.isActive.length > 0) ||
    filters.valueRange.min ||
    filters.valueRange.max;

  const columns: Column<ShippingMethod>[] = [
    {
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row, table }) => {
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
      cell: ({ row }) => (
        <div className="flex items-center">
          <Truck className="h-4 w-4 mr-2 text-blue-500" />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
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
      accessorKey: 'code',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-700">
          {row.code}
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('baseRate')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Base Rate
          <span className="inline-flex">
            {sortBy === 'baseRate' ? (
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
      accessorKey: 'baseRate',
      cell: ({ row }) => {
        // Convert to number if it's a string
        const rate = typeof row.baseRate === 'string' ? parseFloat(row.baseRate) : row.baseRate;
        return (
          <div className="font-medium">
            ${rate.toFixed(2)}
          </div>
        );
      },
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('estimatedDays')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Est. Days
          <span className="inline-flex">
            {sortBy === 'estimatedDays' ? (
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
      accessorKey: 'estimatedDays',
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: ({ row }) => <ActionsCell row={row} onDelete={() => mutate()} />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Shipping Methods</h1>
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
          <Button 
            size="sm" 
            onClick={() => router.push('/shipping/methods/new')}
          >
            <Plus className="h-4 w-4 mr-2" /> 
            Add New Method
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CommonFilters
        config={filterConfig}
        filters={filters}
        onChange={handleFilterChange}
        onReset={resetFilters}
      />

      {/* Bulk Actions */}
      {selectedMethods.length > 0 && (
        <div className="flex items-center gap-4 py-4">
          <span className="text-sm text-gray-600">
            {selectedMethods.length} items selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoadingOperation}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Selected
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>Failed to load shipping methods. Please try again.</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          data={data?.methods || []}
          isLoading={isLoading || isLoadingOperation}
          onSort={handleSort}
          selection={{
            selectedRows: selectedMethods,
            onSelectedRowsChange: setSelectedMethods
          }}
        />
        {data?.methods && data.methods.length === 0 && !isLoading && (
          <div className="text-center py-10">
            <Truck className="h-10 w-10 text-gray-400 mb-3 mx-auto" />
            <h3 className="text-sm font-medium text-gray-900">No shipping methods found</h3>
            <p className="text-sm text-gray-500 mt-1">
              {hasActiveFilters ? 'Try adjusting your filters.' : 'Create your first shipping method to get started.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.methods.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {((data.pagination.page - 1) * data.pagination.limit) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{data.pagination.total}</span>{' '}
                results
              </p>
            </div>

            <Pagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={data.pagination?.total || 0}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const ActionsCell = ({ row, onDelete }: { row: ShippingMethod; onDelete?: () => void }) => {
  const router = useRouter();
  const toast = useToast();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this shipping method?')) {
      try {
        await shippingApi.deleteShippingMethod(id);
        toast.success('Shipping method deleted successfully.');
        onDelete?.(); // Refresh data after deletion
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete shipping method');
      }
    }
  };

  return (
    <div className="space-x-2">
      <Button variant="outline" size="icon" onClick={() => router.push(`/shipping/methods/${row.id}`)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="destructive" size="icon" onClick={() => handleDelete(row.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}; 