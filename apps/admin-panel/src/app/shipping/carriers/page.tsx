'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Truck,
  Trash2,
  Eye,
  Settings,
  ToggleLeft,
  ToggleRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, type FilterState, type FilterConfig } from '@/components/ui/CommonFilters';
import { 
  shippingApi,
  ShippingCarrierListParams,
} from '@/services/shipping.service';
import { 
  ShippingCarrier, 
  ShippingCarrierType,
  ShippingCarriersResponse,
} from '@/types/shipping';

// Filter configuration
const filterConfig: FilterConfig = {
  search: {
    type: 'text',
    placeholder: 'Search by name or code',
  },
  enabled: {
    type: 'select',
    placeholder: 'Filter by status',
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
  },
  type: {
    type: 'select',
    placeholder: 'Filter by type',
    options: [
      { value: 'domestic', label: 'Domestic' },
      { value: 'international', label: 'International' },
      { value: 'both', label: 'Both' },
      { value: 'custom', label: 'Custom' },
    ],
  },
};

// Filter state interface
interface ShippingCarrierFilterState extends FilterState {
  enabled: string[];
  type: string[];
}

const initialFilters: ShippingCarrierFilterState = {
  search: '',
  enabled: [],
  type: [],
};

export default function ShippingCarriersPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [filters, setFilters] = useState<ShippingCarrierFilterState>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch carriers
  const fetchCarriers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: ShippingCarrierListParams = {
        page,
        pageSize,
        search: filters.search,
        enabled: filters.enabled.length ? filters.enabled[0] === 'true' : undefined,
        type: filters.type,
        sortBy,
        sortOrder,
      };

      const response = await shippingApi.listShippingCarriers(params);
      setCarriers(response.items);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch carriers:', error);
      toast.error('Failed to load shipping carriers');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters, sortBy, sortOrder, toast]);

  useEffect(() => {
    fetchCarriers();
  }, [fetchCarriers]);

  const handleApiOperation = async (operation: () => Promise<any>, successMessage: string) => {
    try {
      await operation();
      toast.success(successMessage);
      fetchCarriers();
    } catch (error) {
      console.error('Operation failed:', error);
      toast.error('Operation failed. Please try again.');
    }
  };

  const handleDeleteCarrier = async (carrierId: string) => {
    if (window.confirm('Are you sure you want to delete this carrier?')) {
      await handleApiOperation(
        () => shippingApi.deleteShippingCarrier(carrierId),
        'Shipping carrier deleted successfully'
      );
    }
  };

  const handleToggleStatus = async (carrierId: string) => {
    await handleApiOperation(
      () => shippingApi.toggleShippingCarrierStatus(carrierId),
      'Carrier status updated successfully'
    );
  };

  const handleViewCarrier = (carrierId: string) => {
    router.push(`/shipping/carriers/${carrierId}`);
  };

  const handleEditCarrier = (carrierId: string) => {
    router.push(`/shipping/carriers/${carrierId}/edit`);
  };

  const handleAddNewCarrier = () => {
    router.push('/shipping/carriers/new');
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters as ShippingCarrierFilterState);
    setPage(1);
  };

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

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ChevronsUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getCarrierTypeLabel = (type: string): string => {
    switch (type) {
      case ShippingCarrierType.DOMESTIC:
        return 'Domestic';
      case ShippingCarrierType.INTERNATIONAL:
        return 'International';
      case ShippingCarrierType.BOTH:
        return 'Both';
      case ShippingCarrierType.CUSTOM:
        return 'Custom';
      default:
        return type;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Shipping Carriers</h1>
        <Button onClick={handleAddNewCarrier}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Carrier
        </Button>
      </div>

      <div className="mb-6">
        <CommonFilters
          config={filterConfig}
          filters={filters}
          onChange={handleFiltersChange}
          onReset={() => setFilters(initialFilters)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Name {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('code')} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Code {getSortIcon('code')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('type')} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Type {getSortIcon('type')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('isEnabled')} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Status {getSortIcon('isEnabled')}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading carriers...
                  </div>
                </TableCell>
              </TableRow>
            ) : carriers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No carriers found
                </TableCell>
              </TableRow>
            ) : (
              carriers.map((carrier) => (
                <TableRow key={carrier.id}>
                  <TableCell>{carrier.name}</TableCell>
                  <TableCell>{carrier.code}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      carrier.type === ShippingCarrierType.DOMESTIC
                        ? 'bg-blue-100 text-blue-700'
                        : carrier.type === ShippingCarrierType.INTERNATIONAL
                        ? 'bg-purple-100 text-purple-700'
                        : carrier.type === ShippingCarrierType.BOTH
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {getCarrierTypeLabel(carrier.type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(carrier.id)}
                      >
                        {carrier.isEnabled ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                      <span className={carrier.isEnabled ? 'text-green-500' : 'text-gray-400'}>
                        {carrier.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCarrier(carrier.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCarrier(carrier.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCarrier(carrier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4">
        <Pagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
} 