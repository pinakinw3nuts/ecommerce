'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { 
  Package, 
  Plus, 
  Download,
  Trash2, 
  Pencil,
  CheckSquare,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Ban,
  Filter,
  Search,
  ImageIcon,
  Star,
  X as XIcon,
  Loader2
} from 'lucide-react';
import Table from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useCategories } from '@/hooks/useCategories';
import { TableInstance } from '@/components/Table';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, type FilterState, type FilterConfig, type RangeFilter, type DateRangeFilter } from '@/components/ui/CommonFilters';
import { Product, ProductsResponse } from '@/services/products';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

const defaultFilterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search products by name or SKU...',
  },
  categories: {
    type: 'select',
    placeholder: 'Filter by category',
    options: [],
  },
  statuses: {
    type: 'select',
    placeholder: 'Filter by status',
    options: [
      { value: 'in_stock', label: 'In Stock' },
      { value: 'low_stock', label: 'Low Stock' },
      { value: 'out_of_stock', label: 'Out of Stock' },
    ],
  },
  isFeatured: {
    type: 'boolean',
    placeholder: 'Featured Products',
    options: [
      { value: 'true', label: 'Featured' },
      { value: 'false', label: 'Not Featured' },
    ],
  },
  isPublished: {
    type: 'boolean',
    placeholder: 'Published Status',
    options: [
      { value: 'true', label: 'Published' },
      { value: 'false', label: 'Draft' },
    ],
  },
  valueRange: {
    type: 'valueRange',
    placeholder: 'Price Range',
  },
};

const initialFilters: FilterState = {
  search: '',
  categories: [],
  statuses: [],
  isFeatured: [],
  isPublished: [],
  valueRange: {
    min: '',
    max: '',
  },
};

const fetcher = async (url: string) => {
  try {
    console.log(`Fetching products from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => {
        console.error('Failed to parse error response as JSON');
        return {};
      });
      console.error('Error response:', error);
      
      if (response.status === 401) {
        console.log('Unauthorized access, redirecting to login');
        window.location.href = '/login';
        return;
      }
      
      throw new Error(error.message || 'Failed to fetch products');
    }
    
    const data = await response.json();
    console.log('Successfully fetched products data:', {
      productsCount: data.products?.length,
      pagination: data.pagination,
      firstProduct: data.products?.[0]?.name,
      lastProduct: data.products?.[data.products?.length - 1]?.name
    });
    
    // Validate response structure
    if (!data || (!Array.isArray(data.products) && !Array.isArray(data))) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from API');
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetcher:', error);
    throw error;
  }
};

export default function ProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(defaultFilterConfig);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isFeaturedFilterActive, setIsFeaturedFilterActive] = useState(false);
  const [isPublishedFilterActive, setIsPublishedFilterActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch categories for the dropdown
  const { categories, isLoading: loadingCategories } = useCategories();
  
  // Update filter config when categories are loaded
  useEffect(() => {
    setFilterConfig(prevConfig => ({
      ...prevConfig,
      categories: {
        ...prevConfig.categories,
        options: categories,
        isLoading: loadingCategories
      }
    }));
  }, [categories, loadingCategories]);

  // Add debouncing for filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
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
    
    // Process all array-type filters dynamically
    Object.entries(debouncedFilters).forEach(([key, value]) => {
      // Skip search and range filters (handled separately)
      if (key === 'search' || key === 'valueRange' || key === 'dateRange') {
        return;
      }
      
      // Handle array filters
      if (Array.isArray(value) && value.length > 0) {
        // Special case for categories (for backward compatibility)
        if (key === 'categories') {
          if (value.length === 1) {
            params.append('categoryId', value[0]);
            console.log(`Adding single category filter: ${value[0]}`);
          } else {
            params.append('categoryIds', value.join(','));
            console.log(`Adding multiple categories filter: ${value.join(',')}`);
          }
        } 
        // Handle boolean filters (isFeatured, isPublished) - take only first value and convert to boolean
        else if (key === 'isFeatured' || key === 'isPublished') {
          if (value.length > 0) {
            // Just use the value directly without array brackets
            params.append(key, value[0]);
            console.log(`Adding ${key} filter: ${value[0]}`);
          }
        }
        // Handle other array filters (statuses, etc.)
        else {
          params.append(key, value.join(','));
          console.log(`Adding ${key} filter: ${value.join(',')}`);
        }
      }
    });
    
    // Process range filters - note that API expects minPrice/maxPrice (not priceMin/priceMax)
    const valueRange = debouncedFilters.valueRange as { min: string; max: string } | undefined;
    if (valueRange?.min) {
      params.append('minPrice', valueRange.min);
      console.log(`Adding price min: ${valueRange.min}`);
    }
    if (valueRange?.max) {
      params.append('maxPrice', valueRange.max);
      console.log(`Adding price max: ${valueRange.max}`);
    }

    // Process date range filters if needed
    const dateRange = debouncedFilters.dateRange as { from: string; to: string } | undefined;
    if (dateRange?.from) {
      params.append('dateFrom', dateRange.from);
      console.log(`Adding date from: ${dateRange.from}`);
    }
    if (dateRange?.to) {
      params.append('dateTo', dateRange.to);
      console.log(`Adding date to: ${dateRange.to}`);
    }

    console.log(`Full request URL: /api/products?${params.toString()}`);
    return `/api/products?${params.toString()}`;
  }, [page, pageSize, debouncedFilters, sortBy, sortOrder]);

  // Create a key for SWR that changes when pagination, sorting, or filters change
  const swr_key = `products?${new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sortBy,
    sortOrder,
    filters: JSON.stringify(debouncedFilters),
  }).toString()}`;

  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
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
    setSelectedProducts([]);
    // Force a data refresh
    mutate();
  }, [mutate]);

  // Add effect for client-side sorting
  useEffect(() => {
    // Only apply client-side sorting for special columns when data is available
    if (data?.products && data.products.length > 0 && 
        (sortBy === 'isFeatured' || sortBy === 'isPublished')) {
      console.log(`Applying client-side sorting for ${sortBy}`);
      
      const sortedProducts = [...data.products].sort((a, b) => {
        if (sortBy === 'isFeatured') {
          // For boolean values, true comes before false in ascending order
          const aValue = a.isFeatured ? 1 : 0;
          const bValue = b.isFeatured ? 1 : 0;
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        } else if (sortBy === 'isPublished') {
          const aValue = a.isPublished ? 1 : 0;
          const bValue = b.isPublished ? 1 : 0;
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
      
      // Update the data with sorted products without triggering a refetch
      mutate({
        products: sortedProducts,
        pagination: data.pagination
      }, false);
    }
  }, [data, sortBy, sortOrder]);

  const handleSort = (column: string) => {
    // Only allow sorting by fields supported by the backend API
    const allowedSortFields = ['name', 'price', 'createdAt'];
    
    // Handle special case for client-side sorting
    if (column === 'isFeatured' || column === 'isPublished') {
      console.log(`Sorting by ${column} using client-side sorting`);
      
      // Toggle sort order if already sorting by this column
      if (sortBy === column) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(column);
        setSortOrder('asc');
      }
      
      // Apply client-side sorting if we have data
      if (data?.products && data.products.length > 0) {
        const sortedProducts = [...data.products].sort((a, b) => {
          if (column === 'isFeatured') {
            // For boolean values, true comes before false in ascending order
            const aValue = a.isFeatured ? 1 : 0;
            const bValue = b.isFeatured ? 1 : 0;
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          } else if (column === 'isPublished') {
            const aValue = a.isPublished ? 1 : 0;
            const bValue = b.isPublished ? 1 : 0;
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          }
          return 0;
        });
        
        // Update the data with sorted products
        mutate({
          products: sortedProducts,
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

  const handleApiOperation = async (operation: () => Promise<Response>, successMessage: string) => {
    try {
      setIsLoadingOperation(true);
      const response = await operation();
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${successMessage.toLowerCase()}`);
      }
      
      toast.success(successMessage);
      mutate();
      return true;
    } catch (error) {
      console.error(`Error: ${successMessage.toLowerCase()}:`, error);
      toast.error(`Failed to ${successMessage.toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleStatusChange = (productId: string, newStatus: string) => 
    handleApiOperation(
      () => fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, status: newStatus }),
      }),
      'Product status updated successfully'
    );

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const success = await handleApiOperation(
      () => fetch(`/api/products/${productId}`, { method: 'DELETE' }),
      'Product deleted successfully'
    );
    
    if (success) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    
    const success = await handleApiOperation(
      () => fetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProducts }),
      }),
      `${selectedProducts.length} products deleted successfully`
    );
    
    if (success) {
      setSelectedProducts([]);
    }
  };

  const handleBulkStatusChange = async (newStatus: 'in_stock' | 'low_stock' | 'out_of_stock') => {
    if (!confirm(`Are you sure you want to mark ${selectedProducts.length} products as ${newStatus.replace('_', ' ')}?`)) return;
    
    const success = await handleApiOperation(
      () => fetch('/api/products/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProducts, status: newStatus }),
      }),
      `${selectedProducts.length} products updated successfully`
    );
    
    if (success) {
      setSelectedProducts([]);
    }
  };

  const handleExport = () => 
    handleApiOperation(
      async () => {
        const response = await fetch('/api/products/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: selectedProducts.length ? selectedProducts : 'all' }),
        });
        
        if (!response.ok) throw new Error('Failed to export products');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return response;
      },
      'Products exported successfully'
    );

  const handlePageChange = (newPage: number) => {
    console.log(`Changing page from ${page} to ${newPage}`);
    
    // Only change if it's actually a different page
    if (newPage !== page) {
      // Clear selections when changing pages
      setSelectedProducts([]);
      
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
    setSelectedProducts([]);
  };

  const handleToggleFeatured = () => {
    setIsFeaturedFilterActive(!isFeaturedFilterActive);
    setFilters(prev => ({
      ...prev,
      isFeatured: isFeaturedFilterActive ? [] : ['true'],
    }));
    setPage(1);
    mutate();
  };

  const handleTogglePublish = () => {
    setIsPublishedFilterActive(!isPublishedFilterActive);
    setFilters(prev => ({
      ...prev,
      isPublished: isPublishedFilterActive ? [] : ['true'],
    }));
    setPage(1);
    mutate();
  };

  const handleDeleteSelected = () => {
    if (!confirm('Are you sure you want to delete selected products?')) return;
    handleBulkDelete();
  };

  const handleFilterChange = (newFilters: FilterState) => {
    console.log('Updating filters:', newFilters);
    setFilters(newFilters);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Update filters with the search term
    setFilters(prev => ({
      ...prev,
      search: value
    }));
    
    // Reset to first page when search changes
    setPage(1);
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
      cell: ({ row, table }: { row: Product; table: TableInstance & { getRowProps: (row: Product) => { getIsSelected: () => boolean; getToggleSelectedHandler: () => () => void } } }) => {
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
      width: '60px',
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('name')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Product
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
      cell: ({ row }: { row: Product }) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg flex-shrink-0">
            {row.mediaUrl && row.mediaUrl.trim() !== '' ? (
              <Image
                src={row.mediaUrl}
                alt={row.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{row.name}</div>
            <div className="text-sm text-gray-500">
              ${row.price.toFixed(2)}
            </div>
          </div>
        </div>
      ),
      width: '30%',
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('slug')}
          className="flex items-center gap-1 hover:text-blue-600 hidden sm:flex"
        >
          Slug
          <span className="inline-flex">
            {sortBy === 'slug' ? (
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
      cell: ({ row }: { row: Product }) => (
        <span className="text-sm text-gray-600 truncate max-w-xs block hidden sm:block">
          {row.slug}
        </span>
      ),
      width: '30%',
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('category')}
          className="flex items-center gap-1 hover:text-blue-600 hidden md:flex"
        >
          Category
          <span className="inline-flex">
            {sortBy === 'category' ? (
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
      cell: ({ row }: { row: Product }) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 hidden md:inline-flex">
          {typeof row.category === 'object' ? 
            (row.category as any)?.name || 'Unknown' : 
            row.category}
        </span>
      ),
      width: '15%',
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('isFeatured')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Featured
          <span className="inline-flex">
            {sortBy === 'isFeatured' ? (
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
      cell: ({ row }: { row: Product }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.isFeatured
            ? 'bg-purple-100 text-purple-700'
            : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.isFeatured ? 'Featured' : 'Not Featured'}
        </span>
      ),
      width: '10%',
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('isPublished')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Published
          <span className="inline-flex">
            {sortBy === 'isPublished' ? (
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
      cell: ({ row }: { row: Product }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.isPublished
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {row.isPublished ? 'Published' : 'Draft'}
        </span>
      ),
      width: '10%',
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('createdAt')}
          className="flex items-center gap-1 hover:text-blue-600 hidden md:flex"
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
      cell: ({ row }: { row: Product }) => (
        <span className="text-sm text-gray-500 hidden md:inline">
          {formatDate(row.createdAt)}
        </span>
      ),
      width: '15%',
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: Product }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/products/${row.id}/edit`)}
            disabled={isLoadingOperation}
            aria-label="Edit product"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.id)}
            disabled={isLoadingOperation}
            aria-label="Delete product"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: '100px',
    },
  ];

  if (error) {
    console.error('Rendering error state:', error);
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600 font-medium">Failed to load products</p>
        <p className="text-red-500 text-sm mt-1">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => {
            console.log('Retrying products fetch...');
            mutate();
          }}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Products</h1>
        <div className="flex w-full sm:w-auto items-center justify-between gap-3">
          {/* Bulk Actions Group */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mark Featured Button with Tooltip */}
            {selectedProducts.length === 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      aria-label={isFeaturedFilterActive ? 'Remove Featured' : 'Mark Featured'}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {isFeaturedFilterActive ? 'Remove Featured' : 'Mark Featured'}
                    </Button>
                  </span>
                </PopoverTrigger>
                <PopoverContent sideOffset={8} className="w-auto px-3 py-2 text-sm text-gray-700">
                  Select at least one product to use this action.
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFeatured}
                disabled={isLoadingOperation}
                aria-label={isLoadingOperation ? 'Processing...' : (isFeaturedFilterActive ? 'Remove Featured' : 'Mark Featured')}
              >
                {isLoadingOperation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Star className="h-4 w-4 mr-2" />
                )}
                {isLoadingOperation ? 'Processing...' : (isFeaturedFilterActive ? 'Remove Featured' : 'Mark Featured')}
              </Button>
            )}

            {/* Publish/Unpublish Button with Tooltip */}
            {selectedProducts.length === 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      aria-label={isPublishedFilterActive ? 'Unpublish' : 'Publish'}
                    >
                      {isPublishedFilterActive ? <Ban className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
                      {isPublishedFilterActive ? 'Unpublish' : 'Publish'}
                    </Button>
                  </span>
                </PopoverTrigger>
                <PopoverContent sideOffset={8} className="w-auto px-3 py-2 text-sm text-gray-700">
                  Select at least one product to use this action.
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePublish}
                disabled={isLoadingOperation}
                aria-label={isLoadingOperation ? 'Processing...' : (isPublishedFilterActive ? 'Unpublish' : 'Publish')}
              >
                {isLoadingOperation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  isPublishedFilterActive ? <Ban className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />
                )}
                {isLoadingOperation ? 'Processing...' : (isPublishedFilterActive ? 'Unpublish' : 'Publish')}
              </Button>
            )}

            {/* Delete Button with Tooltip */}
            {selectedProducts.length === 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <span>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled
                      aria-label="Delete selected products"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </span>
                </PopoverTrigger>
                <PopoverContent sideOffset={8} className="w-auto px-3 py-2 text-sm text-gray-700">
                  Select at least one product to use this action.
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={isLoadingOperation}
                aria-label={isLoadingOperation ? 'Processing...' : 'Delete'}
              >
                {isLoadingOperation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {isLoadingOperation ? 'Processing...' : 'Delete'}
              </Button>
            )}
          </div>
          {/* Divider for separation */}
          <div className="hidden sm:block h-6 border-l border-gray-300 mx-2" />
          {/* Add Product Button Group */}
          <div className="flex items-center">
            <Button variant="default" size="sm" onClick={() => router.push('/products/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* Remove custom search bar, filter button, and filter chips */}
      {/* Place a single CommonFilters component above the table */}
      <CommonFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        config={filterConfig}
      />

      {/* Products table with wrapper for horizontal scrolling */}
      <TableWrapper mobileCardLayout>
        <Table
          data={data?.products ?? []}
          columns={columns}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedProducts,
            onSelectedRowsChange: setSelectedProducts,
          }}
          onAdd={() => router.push('/products/create')}
        />
      </TableWrapper>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-4 mb-4 sm:mb-0">
          <p className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {data?.pagination?.total ? (page - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {data?.pagination?.total
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

        <Pagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={data?.pagination?.total || 0}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
} 