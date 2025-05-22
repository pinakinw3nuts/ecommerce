'use client';

import React from 'react';
import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { 
  Eye, 
  RotateCcw,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Search,
  Filter
} from 'lucide-react';
import Table, { type Column } from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { cn } from '@/lib/utils';

interface PaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
}

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  gateway: 'Stripe' | 'Razorpay' | 'COD' | 'Invoice';
  status: 'PAID' | 'FAILED' | 'REFUNDED';
  timestamp: string;
  refundStatus?: {
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    reason?: string;
    refundedAt?: string;
  };
}

interface ApiResponse {
  payments: Payment[];
  pagination: PaginationData;
}

const PAGE_SIZES = [10, 25, 50, 100];

const PAYMENT_STATUSES = ['ALL', 'PAID', 'FAILED', 'REFUNDED'] as const;
const PAYMENT_GATEWAYS = ['ALL', 'Stripe', 'Razorpay', 'COD', 'Invoice'] as const;

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  
  return response.json();
};

export default function PaymentsPage() {
  const toast = useToast();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<typeof PAYMENT_STATUSES[number]>('ALL');
  const [selectedGateway, setSelectedGateway] = useState<typeof PAYMENT_GATEWAYS[number]>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const queryString = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy,
    sortOrder,
    ...(searchQuery && { search: searchQuery }),
    ...(selectedStatus !== 'ALL' && { status: selectedStatus }),
    ...(selectedGateway !== 'ALL' && { gateway: selectedGateway }),
  }).toString();

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    `/api/payments?${queryString}`,
    fetcher
  );

  const handleRefund = async (payment: Payment) => {
    if (!confirm('Are you sure you want to initiate a refund?')) return;

    try {
      setIsRefunding(true);
      const response = await fetch(`/api/payments/${payment.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to initiate refund');
      
      await mutate();
      setSelectedPayment(null);
      toast.success('Refund initiated successfully');
    } catch (error) {
      console.error('Error initiating refund:', error);
      toast.error('Failed to initiate refund');
    } finally {
      setIsRefunding(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/payments/export?format=csv&${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to export payments');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payments-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Payments exported successfully');
    } catch (error) {
      console.error('Error exporting payments:', error);
      toast.error('Failed to export payments');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleSort = (field: keyof Payment) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field as string);
      setSortOrder('asc');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (value: typeof PAYMENT_STATUSES[number]) => {
    setSelectedStatus(value);
    setPage(1);
  };

  const handleGatewayChange = (value: typeof PAYMENT_GATEWAYS[number]) => {
    setSelectedGateway(value);
    setPage(1);
  };

  const resetFilters = () => {
    setSelectedStatus('ALL');
    setSelectedGateway('ALL');
    setSearchQuery('');
    setPage(1);
  };

  const columns: Column<Payment>[] = [
    {
      header: () => (
        <button
          onClick={() => handleSort('orderId')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          ORDER ID
          <span className="inline-flex">
            {sortBy === 'orderId' ? (
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
      accessorKey: 'orderId',
      cell: ({ row }) => (
        <div className="font-medium">{row.orderId}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('amount')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          AMOUNT
          <span className="inline-flex">
            {sortBy === 'amount' ? (
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
      accessorKey: 'amount',
      cell: ({ row }) => (
        <div className="font-medium">${row.amount.toFixed(2)}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('gateway')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          GATEWAY
          <span className="inline-flex">
            {sortBy === 'gateway' ? (
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
      accessorKey: 'gateway',
      cell: ({ row }) => (
        <div>{row.gateway}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('status')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          STATUS
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
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize
          ${row.status === 'PAID' ? 'bg-green-100 text-green-700' :
            row.status === 'FAILED' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'}`}>
          {row.status.toLowerCase()}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('timestamp')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          DATE
          <span className="inline-flex">
            {sortBy === 'timestamp' ? (
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
      accessorKey: 'timestamp',
      cell: ({ row }) => (
        <div>{format(new Date(row.timestamp), 'dd/MM/yyyy')}</div>
      ),
    },
    {
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPayment(row)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
          {row.status === 'PAID' && !row.refundStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRefund(row)}
              disabled={isRefunding}
              className="gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Refund
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Payments</h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className={cn(
                "shrink-0",
                (selectedStatus !== 'ALL' || selectedGateway !== 'ALL') && 
                "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}>
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <Select
                    value={selectedStatus}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === 'ALL' ? 'All Statuses' : status.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Gateway</p>
                  <Select
                    value={selectedGateway}
                    onValueChange={handleGatewayChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_GATEWAYS.map((gateway) => (
                        <SelectItem key={gateway} value={gateway}>
                          {gateway === 'ALL' ? 'All Gateways' : gateway}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="w-full"
                >
                  Reset Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table
          data={data?.payments || []}
          columns={columns}
          isLoading={isLoading}
        />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700">
            Showing {data ? (page - 1) * pageSize + 1 : 0} to{' '}
            {data ? Math.min(page * pageSize, data.pagination.total) : 0} of{' '}
            {data?.pagination.total || 0} results
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{pageSize} per page</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[100px]">
                {PAGE_SIZES.map(size => (
                  <DropdownMenuItem
                    key={size}
                    onSelect={() => handlePageSizeChange(size)}
                    className="justify-center"
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
            className="h-8 px-3"
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="h-8 px-3"
          >
            Previous
          </Button>
          {Array.from({ length: data?.pagination.totalPages || 0 }, (_, i) => i + 1)
            .filter(pageNum => {
              // Show first page, last page, current page, and pages around current
              return (
                pageNum === 1 ||
                pageNum === data?.pagination.totalPages ||
                (pageNum >= page - 1 && pageNum <= page + 1)
              );
            })
            .map((pageNum, index, array) => {
              // Add ellipsis between non-consecutive pages
              if (index > 0 && pageNum - array[index - 1] > 1) {
                return (
                  <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-500">
                    ...
                  </span>
                );
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={`h-8 min-w-[32px] px-3 ${
                    pageNum === page ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={!data?.pagination.hasMore}
            className="h-8 px-3"
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(data?.pagination.totalPages || 1)}
            disabled={page === (data?.pagination.totalPages || 1)}
            className="h-8 px-3"
          >
            Last
          </Button>
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Payment Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPayment(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <dl className="space-y-4 divide-y divide-gray-100">
              <div className="pt-4 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                <dd className="text-sm text-gray-900 col-span-2">{selectedPayment.orderId}</dd>
              </div>
              <div className="pt-4 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Amount</dt>
                <dd className="text-sm text-gray-900 col-span-2">${selectedPayment.amount.toFixed(2)}</dd>
              </div>
              <div className="pt-4 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Gateway</dt>
                <dd className="text-sm text-gray-900 col-span-2 capitalize">{selectedPayment.gateway}</dd>
              </div>
              <div className="pt-4 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900 col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${selectedPayment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      selectedPayment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                    {selectedPayment.status.toLowerCase()}
                  </span>
                </dd>
              </div>
              <div className="pt-4 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="text-sm text-gray-900 col-span-2">
                  {format(new Date(selectedPayment.timestamp), 'PPpp')}
                </dd>
              </div>
              {selectedPayment.refundStatus && (
                <>
                  <div className="pt-4 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Refund Status</dt>
                    <dd className="text-sm text-gray-900 col-span-2 capitalize">{selectedPayment.refundStatus.status.toLowerCase()}</dd>
                  </div>
                  {selectedPayment.refundStatus.reason && (
                    <div className="pt-4 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Refund Reason</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{selectedPayment.refundStatus.reason}</dd>
                    </div>
                  )}
                  {selectedPayment.refundStatus.refundedAt && (
                    <div className="pt-4 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Refunded At</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {format(new Date(selectedPayment.refundStatus.refundedAt), 'PPpp')}
                      </dd>
                    </div>
                  )}
                </>
              )}
            </dl>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </Button>
              {selectedPayment.status === 'PAID' && !selectedPayment.refundStatus && (
                <Button
                  variant="destructive"
                  onClick={() => handleRefund(selectedPayment)}
                  disabled={isRefunding}
                >
                  {isRefunding ? 'Processing...' : 'Initiate Refund'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}