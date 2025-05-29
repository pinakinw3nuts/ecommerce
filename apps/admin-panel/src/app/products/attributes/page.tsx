'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  Plus, 
  Trash2, 
  Pencil,
  Eye,
  Tag,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
} from 'lucide-react';
import Table from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { TableInstance } from '@/components/Table';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, type FilterState, type FilterConfig } from '@/components/ui/CommonFilters';
import { 
  getAttributes, 
  deleteAttribute, 
  bulkDeleteAttributes,
  Attribute
} from '@/services/attributes';

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search attributes by name...',
  },
  type: {
    type: 'select',
    placeholder: 'Filter by type',
    options: [
      { value: 'select', label: 'Select' },
      { value: 'multiple', label: 'Multiple' },
      { value: 'text', label: 'Text' },
      { value: 'number', label: 'Number' },
      { value: 'boolean', label: 'Boolean' },
    ],
  },
  isFilterable: {
    type: 'boolean',
    placeholder: 'Filterable',
    options: [
      { value: 'true', label: 'Filterable' },
      { value: 'false', label: 'Not Filterable' },
    ],
  },
  isRequired: {
    type: 'boolean',
    placeholder: 'Required',
    options: [
      { value: 'true', label: 'Required' },
      { value: 'false', label: 'Optional' },
    ],
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
  type: [],
  isFilterable: [],
  isRequired: [],
  isActive: [],
};

const fetcher = async (url: string) => {
  try {
    console.log(`Fetching attributes from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => {
        return {};
      });
      
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      
      throw new Error(error.message || 'Failed to fetch attributes');
    }
    
    const data = await response.json();
    console.log('Attributes API response:', {
      total: data.pagination?.total || 'N/A',
      attributesCount: data.attributes?.length || 0,
      responseStructure: Object.keys(data),
      firstAttribute: data.attributes && data.attributes.length > 0 ? 
        { id: data.attributes[0].id, name: data.attributes[0].name } : 'None'
    });
    return data;
  } catch (error) {
    console.error('Error in fetcher:', error);
    throw error;
  }
};

export default function AttributesPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
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
    setSelectedAttributes([]);
  }, []);

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
      }
    }
    
    // Process type filter (multi-select)
    if (Array.isArray(debouncedFilters.type) && debouncedFilters.type.length > 0) {
      params.append('type', debouncedFilters.type.join(','));
    }
    
    // Process isFilterable (boolean filter)
    if (Array.isArray(debouncedFilters.isFilterable) && debouncedFilters.isFilterable.length > 0) {
      // Convert string 'true'/'false' to actual boolean values
      const isFilterable = debouncedFilters.isFilterable[0] === 'true';
      params.append('isFilterable', String(isFilterable));
    }
    
    // Process isRequired (boolean filter)
    if (Array.isArray(debouncedFilters.isRequired) && debouncedFilters.isRequired.length > 0) {
      // Convert string 'true'/'false' to actual boolean values
      const isRequired = debouncedFilters.isRequired[0] === 'true';
      params.append('isRequired', String(isRequired));
    }
    
    // Process isActive (boolean filter)
    if (Array.isArray(debouncedFilters.isActive) && debouncedFilters.isActive.length > 0) {
      // Convert string 'true'/'false' to actual boolean values
      const isActive = debouncedFilters.isActive[0] === 'true';
      params.append('isActive', String(isActive));
    }
    
    // Log the final URL for debugging
    const url = `/api/products/attributes?${params.toString()}`;
    console.log('Attributes API URL:', url);
    
    return url;
  }, [page, pageSize, sortBy, sortOrder, debouncedFilters]);

  const { data, error, isLoading, mutate } = useSWR(getApiUrl(), fetcher);
  
  const attributes = data?.attributes || [];
  const pagination: PaginationInfo = data?.pagination || {
    total: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    hasMore: false,
    hasPrevious: false,
  };

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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Operation failed');
      }
      
      toast.success(successMessage);
      mutate(); // Refresh the data
      return true;
    } catch (error) {
      console.error('API operation error:', error);
      toast.error(error instanceof Error ? error.message : 'Operation failed');
      return false;
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleDelete = async (attributeId: string) => {
    if (!confirm('Are you sure you want to delete this attribute?')) return;
    
    const success = await handleApiOperation(
      () => deleteAttribute(attributeId),
      'Attribute deleted successfully'
    );
    
    if (success) {
      setSelectedAttributes(prev => prev.filter(id => id !== attributeId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAttributes.length === 0) {
      toast.error('No attributes selected');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedAttributes.length} selected attributes?`)) return;
    
    const success = await handleApiOperation(
      () => bulkDeleteAttributes(selectedAttributes),
      `${selectedAttributes.length} attributes deleted successfully`
    );
    
    if (success) {
      setSelectedAttributes([]);
    }
  };

  const handleExport = () => {
    // Implement export functionality similar to categories
    handleApiOperation(
      async () => {
        const response = await fetch('/api/products/attributes/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributeIds: selectedAttributes.length ? selectedAttributes : 'all' }),
        });
        
        if (!response.ok) throw new Error('Failed to export attributes');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attributes.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return response;
      },
      'Attributes exported successfully'
    );
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedAttributes([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedAttributes([]);
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
      cell: ({ row, table }: { row: Attribute; table: any }) => {
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
      accessorKey: 'name' as keyof Attribute,
      cell: ({ row }: { row: Attribute }) => (
        <div className="flex items-center">
          <Tag className="h-4 w-4 mr-2 text-blue-500" />
          <span className="font-medium">{row.name}</span>
        </div>
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
      accessorKey: 'type' as keyof Attribute,
      cell: ({ row }: { row: Attribute }) => (
        <span className="capitalize">{row.type}</span>
      ),
    },
    {
      header: 'Values',
      accessorKey: 'values' as keyof Attribute,
      cell: ({ row }: { row: Attribute }) => (
        <span>{row.values?.length || 0} values</span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('isFilterable')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Filterable
          <span className="inline-flex">
            {sortBy === 'isFilterable' ? (
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
      accessorKey: 'isFilterable' as keyof Attribute,
      cell: ({ row }: { row: Attribute }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.isFilterable
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.isFilterable ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('isRequired')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Required
          <span className="inline-flex">
            {sortBy === 'isRequired' ? (
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
      accessorKey: 'isRequired' as keyof Attribute,
      cell: ({ row }: { row: Attribute }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.isRequired
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.isRequired ? 'Required' : 'Optional'}
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
      accessorKey: 'isActive' as keyof Attribute,
      cell: ({ row }: { row: Attribute }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.isActive
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('createdAt')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Created At
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
      accessorKey: 'createdAt' as keyof Attribute,
      cell: ({ row }: { row: Attribute }) => (
        <span className="text-sm text-gray-500">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: Attribute }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/products/attributes/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/products/attributes/${row.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
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
        <p className="text-red-600 font-medium">Failed to load attributes</p>
        <p className="text-red-500 text-sm mt-1">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => mutate()}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Product Attributes</h1>
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
            onClick={() => router.push('/products/attributes/new')}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Attribute
          </Button>
        </div>
      </div>

      <CommonFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        config={filterConfig}
      />

      {/* Bulk Actions */}
      {selectedAttributes.length > 0 && (
        <div className="flex items-center gap-4 py-4">
          <span className="text-sm text-gray-600">
            {selectedAttributes.length} items selected
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

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          columns={columns}
          data={attributes}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedAttributes,
            onSelectedRowsChange: setSelectedAttributes,
          }}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {pagination.total ? (page - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {pagination.total
                  ? Math.min(page * pageSize, pagination.total)
                  : 0}
              </span>{' '}
              of{' '}
              <span className="font-medium">{pagination.total || 0}</span>{' '}
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
            totalItems={pagination.total}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
} 