'use client';

import React from 'react';
import { useState } from 'react';
import { format, isValid } from 'date-fns';
import useSWR from 'swr';
import { 
  CreditCard,
  Download,
  Plus, 
  Search,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Table, { type Column, TableInstance } from '@/components/Table';
import { useToast } from '@/hooks/useToast';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, FilterConfig, FilterState } from '@/components/ui/CommonFilters';

interface PaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

interface Payment {
  id: string;
  transactionId: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: 'successful' | 'pending' | 'failed' | 'refunded' | string;
  method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | string;
  createdAt: string;
}

interface ApiResponse {
  payments: Payment[];
  pagination: PaginationData;
}

interface PaymentFilterState extends FilterState {
  status: string[];
  methods: string[];
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
    type: 'text',
    placeholder: 'Search payments...',
  },
  filterGroups: {
    type: 'select',
    placeholder: 'Filter by group',
    options: [
      { value: 'status', label: 'Status' },
      { value: 'methods', label: 'Method' }
    ]
  },
  status: {
    type: 'select',
    placeholder: 'Filter by status',
    options: [
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
      { value: 'failed', label: 'Failed' },
      { value: 'refunded', label: 'Refunded' },
    ],
  },
  methods: {
    type: 'select',
    placeholder: 'Filter by payment method',
    options: [
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'debit_card', label: 'Debit Card' },
      { value: 'paypal', label: 'PayPal' },
      { value: 'bank_transfer', label: 'Bank Transfer' },
    ],
  },
  hasDateRange: {
    type: 'boolean',
    placeholder: 'Enable date range',
  },
  dateRangeLabel: {
    type: 'text',
    placeholder: 'Payment Date',
  },
  hasValueRange: {
    type: 'boolean',
    placeholder: 'Enable value range',
  },
  valueRangeLabel: {
    type: 'text',
    placeholder: 'Amount Range',
  },
  valueRangeType: {
    type: 'text',
    placeholder: 'currency',
  },
};

const initialFilters: PaymentFilterState = {
  search: '',
  status: [],
  methods: [],
  dateRange: { from: '', to: '' },
  valueRange: { min: '', max: '' },
};

const generateMockPayments = () => {
  const customers = [
    { name: 'John Doe', email: 'john.doe@example.com' },
    { name: 'Jane Smith', email: 'jane.smith@example.com' },
    { name: 'Bob Wilson', email: 'bob.wilson@example.com' },
    { name: 'Alice Brown', email: 'alice.brown@example.com' },
    { name: 'Charlie Davis', email: 'charlie.davis@example.com' },
    { name: 'Eva Martinez', email: 'eva.martinez@example.com' },
    { name: 'David Clark', email: 'david.clark@example.com' },
    { name: 'Sarah Johnson', email: 'sarah.j@example.com' },
    { name: 'Michael Lee', email: 'm.lee@example.com' },
    { name: 'Lisa Anderson', email: 'l.anderson@example.com' }
  ];

  const statuses: Payment['status'][] = ['successful', 'pending', 'failed', 'refunded'];
  const methods: Payment['method'][] = ['credit_card', 'debit_card', 'paypal', 'bank_transfer'];
  
  return Array.from({ length: 25 }, (_, index) => {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const amount = parseFloat((Math.random() * 1000 + 50).toFixed(2));
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
    
    return {
      id: (index + 1).toString(),
      transactionId: `TRX-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(index + 1).padStart(3, '0')}`,
      orderId: `ORD-${String(index + 1).padStart(6, '0')}`,
      customerName: customer.name,
      customerEmail: customer.email,
      amount,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      method: methods[Math.floor(Math.random() * methods.length)],
      createdAt: date.toISOString()
    };
  });
};

const fetcher = async (url: string) => {
  // Parse query parameters
  const params = new URLSearchParams(url.split('?')[1]);
  const page = parseInt(params.get('page') || '1');
  const pageSize = parseInt(params.get('pageSize') || '10');
  const search = params.get('search') || '';
  const sortBy = params.get('sortBy') || 'createdAt';
  const sortOrder = params.get('sortOrder') || 'desc';
  const statusFilter = params.get('status')?.split(',') || [];
  const methodsFilter = params.get('methods')?.split(',') || [];
  const dateFrom = params.get('dateFrom');
  const dateTo = params.get('dateTo');
  const minAmount = params.get('minAmount');
  const maxAmount = params.get('maxAmount');

  // Generate all mock payments
  let mockPayments = generateMockPayments();

  // Apply filters
  if (search) {
    const searchLower = search.toLowerCase();
    mockPayments = mockPayments.filter(payment => 
      payment.transactionId.toLowerCase().includes(searchLower) ||
      payment.customerName.toLowerCase().includes(searchLower) ||
      payment.customerEmail.toLowerCase().includes(searchLower)
    );
  }

  if (statusFilter.length) {
    mockPayments = mockPayments.filter(payment => statusFilter.includes(payment.status));
  }

  if (methodsFilter.length) {
    mockPayments = mockPayments.filter(payment => methodsFilter.includes(payment.method));
  }

  if (dateFrom) {
    mockPayments = mockPayments.filter(payment => 
      new Date(payment.createdAt) >= new Date(dateFrom)
    );
  }

  if (dateTo) {
    mockPayments = mockPayments.filter(payment => 
      new Date(payment.createdAt) <= new Date(dateTo)
    );
  }

  if (minAmount) {
    mockPayments = mockPayments.filter(payment => 
      payment.amount >= parseFloat(minAmount)
    );
  }

  if (maxAmount) {
    mockPayments = mockPayments.filter(payment => 
      payment.amount <= parseFloat(maxAmount)
    );
  }

  // Sort payments
  mockPayments.sort((a: any, b: any) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Apply pagination
  const start = (page - 1) * pageSize;
  const paginatedPayments = mockPayments.slice(start, start + pageSize);

  const mockResponse: ApiResponse = {
    payments: paginatedPayments,
    pagination: {
      total: mockPayments.length,
      totalPages: Math.ceil(mockPayments.length / pageSize),
      currentPage: page,
      pageSize: pageSize,
      hasMore: start + pageSize < mockPayments.length,
      hasPrevious: page > 1
    }
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockResponse;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  // Check if the date string is a valid ISO format
  if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
  }
  // Try parsing as Unix timestamp if it's a number
  const timestamp = parseInt(dateString);
  if (!isNaN(timestamp)) {
    const dateFromTimestamp = new Date(timestamp);
    return isValid(dateFromTimestamp) ? format(dateFromTimestamp, 'MMM d, yyyy') : 'Invalid date';
  }
  return 'Invalid date';
};

export default function PaymentsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<PaymentFilterState>(initialFilters);

  const hasActiveFilters = 
    filters.search ||
    filters.status.length > 0 ||
    filters.methods.length > 0 ||
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
    ...(filters.methods.length && { methods: filters.methods.join(',') }),
    ...(filters.dateRange.from && { fromDate: filters.dateRange.from }),
    ...(filters.dateRange.to && { toDate: filters.dateRange.to }),
    ...(filters.valueRange.min && { minAmount: filters.valueRange.min }),
    ...(filters.valueRange.max && { maxAmount: filters.valueRange.max }),
    sortBy,
    sortOrder,
  }).toString();

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    `/api/payments?${queryString}`,
    fetcher
  );

  // Add debug logging
  React.useEffect(() => {
    if (data?.payments) {
      console.log('Payments data:', data.payments);
    }
  }, [data]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters as PaymentFilterState);
    setPage(1);
    setSelectedPayments([]);
  };

  const handleFiltersReset = () => {
    setFilters(initialFilters);
    setPage(1);
    setSelectedPayments([]);
  };

  const handleExport = async () => {
    try {
      setIsLoadingOperation(true);
      const response = await fetch('/api/payments/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIds: selectedPayments.length ? selectedPayments : 'all' }),
      });

      if (!response.ok) {
        throw new Error('Failed to export payments');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payments.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Payments exported successfully');
    } catch (error) {
      console.error('Error exporting payments:', error);
      toast.error('Failed to export payments');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedPayments([]);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedPayments([]);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: ({ table }: { table: TableInstance }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row, table }: { row: Payment; table: TableInstance & { getRowProps: (row: Payment) => { getIsSelected: () => boolean; getToggleSelectedHandler: () => () => void } } }) => {
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
          onClick={() => handleSort('transactionId')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Transaction ID
          <span className="inline-flex">
            {sortBy === 'transactionId' ? (
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
      accessorKey: 'transactionId' as keyof Payment,
      cell: ({ row }: { row: Payment }) => (
        <div className="font-medium text-blue-600">
          {row.transactionId || 'N/A'}
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('orderId')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Order ID
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
      accessorKey: 'orderId' as keyof Payment,
      cell: ({ row }: { row: Payment }) => (
        <div className="font-medium">#{row.orderId}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('customerName')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Customer
          <span className="inline-flex">
            {sortBy === 'customerName' ? (
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
      accessorKey: 'customerName' as keyof Payment,
      cell: ({ row }: { row: Payment }) => (
        <div>
          <div className="font-medium">{row.customerName}</div>
          <div className="text-sm text-gray-500">{row.customerEmail}</div>
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('status')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Status
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
      accessorKey: 'status' as keyof Payment,
      cell: ({ row }: { row: Payment }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.status === 'successful'
            ? 'bg-green-100 text-green-700'
            : row.status === 'pending'
            ? 'bg-yellow-100 text-yellow-700'
            : row.status === 'refunded'
            ? 'bg-orange-100 text-orange-700'
            : row.status === 'failed'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Unknown'}
        </span>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('method')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Method
          <span className="inline-flex">
            {sortBy === 'method' ? (
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
      accessorKey: 'method' as keyof Payment,
      cell: ({ row }: { row: Payment }) => {
        const methodMap: Record<string, string> = {
          credit_card: 'Credit Card',
          debit_card: 'Debit Card',
          paypal: 'PayPal',
          bank_transfer: 'Bank Transfer'
        };
        return (
          <span className="text-sm">
            {methodMap[row.method] || 'Unknown'}
          </span>
        );
      },
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('amount')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Amount
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
      accessorKey: 'amount' as keyof Payment,
      cell: ({ row }: { row: Payment }) => (
        <div className="font-medium">${row.amount.toFixed(2)}</div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('createdAt')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Date
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
      accessorKey: 'createdAt' as keyof Payment,
      cell: ({ row }: { row: Payment }) => (
        <span className="text-sm text-gray-500">
          {formatDate(row.createdAt)}
        </span>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
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

      {/* Table */}
      <div className="rounded-lg border border-gray-200">
        <Table
          data={data?.payments || []}
          columns={columns}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedPayments,
            onSelectedRowsChange: setSelectedPayments,
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
                  ? Math.min(page * pageSize, data.pagination.total)
                  : 0}
              </span>{' '}
              of{' '}
              <span className="font-medium">{data?.pagination.total || 0}</span>{' '}
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
            totalItems={data?.pagination.total || 0}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}