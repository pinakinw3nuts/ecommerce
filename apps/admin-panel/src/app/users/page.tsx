'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  Ban, 
  UserCheck, 
  Users as UsersIcon, 
  Mail,
  Plus,
  Search,
  Download,
  Trash2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Pencil,
  X,
  Filter
} from 'lucide-react';
import Table, { type Column, TableInstance } from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { UserFilters } from '@/components/users/UserFilters';
import { Pagination } from '@/components/ui/Pagination';
import { CommonFilters, FilterConfig, FilterState, DateRangeFilter } from '@/components/ui/CommonFilters';

interface PaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'banned';
  createdAt: string;
}

interface ApiResponse {
  users: User[];
  pagination: PaginationData;
}

interface UserFilterState extends FilterState {
  roles: string[];
  statuses: string[];
  dateRange: {
    from: string;
    to: string;
  };
}

const filterConfig: FilterConfig = {
  search: {
    placeholder: 'Search users by name or email...',
  },
  filterGroups: [
    {
      name: 'Role',
      key: 'roles',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'moderator', label: 'Moderator' },
        { value: 'user', label: 'User' },
      ],
    },
    {
      name: 'Status',
      key: 'statuses',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'banned', label: 'Banned' },
        { value: 'pending', label: 'Pending' },
      ],
    },
  ],
  hasDateRange: true,
  dateRangeLabel: 'Registration Date',
};

const initialFilters: UserFilterState = {
  search: '',
  roles: [],
  statuses: [],
  dateRange: { from: '', to: '' },
};

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

export default function UsersPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoadingUserOperation, setIsLoadingUserOperation] = useState(false);
  const [filters, setFilters] = useState<UserFilterState>(initialFilters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const hasActiveFilters = 
    filters.search ||
    filters.roles.length > 0 ||
    filters.statuses.length > 0 ||
    filters.dateRange.from ||
    filters.dateRange.to;

  // Build query string from filters
  const queryString = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search: filters.search,
    ...(filters.roles.length && { roles: filters.roles.join(',') }),
    ...(filters.statuses.length && { statuses: filters.statuses.join(',') }),
    ...(filters.dateRange.from && { dateFrom: filters.dateRange.from }),
    ...(filters.dateRange.to && { dateTo: filters.dateRange.to }),
    sortBy,
    sortOrder,
  }).toString();

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    `/api/users?${queryString}`,
    fetcher
  );

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'banned') => {
    try {
      setIsLoadingUserOperation(true);
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      mutate();
      toast.success(`User ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setIsLoadingUserOperation(false);
    }
  };

  const handleSendEmail = async (userId: string) => {
    try {
      setIsLoadingUserOperation(true);
      const response = await fetch(`/api/users/${userId}/email`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast.success('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsLoadingUserOperation(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: 'active' | 'banned') => {
    if (!confirm(`Are you sure you want to ${newStatus === 'banned' ? 'ban' : 'unban'} ${selectedUsers.length} users?`)) return;

    try {
      setIsLoadingUserOperation(true);
      const response = await fetch('/api/users/bulk-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userIds: selectedUsers,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update users');
      }

      mutate();
      setSelectedUsers([]);
      toast.success(`${selectedUsers.length} users ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully`);
    } catch (error) {
      console.error('Error updating users:', error);
      toast.error('Failed to update users');
    } finally {
      setIsLoadingUserOperation(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;

    try {
      setIsLoadingUserOperation(true);
      const response = await fetch('/api/users/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete users');
      }

      mutate();
      setSelectedUsers([]);
      toast.success(`${selectedUsers.length} users deleted successfully`);
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error('Failed to delete users');
    } finally {
      setIsLoadingUserOperation(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoadingUserOperation(true);
      const response = await fetch('/api/users/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: selectedUsers.length ? selectedUsers : 'all' }),
      });

      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    } finally {
      setIsLoadingUserOperation(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedUsers([]); // Clear selection when changing pages
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
    setSelectedUsers([]); // Clear selection
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters({
      search: newFilters.search,
      roles: (newFilters.roles as string[]) || [],
      statuses: (newFilters.statuses as string[]) || [],
      dateRange: (newFilters.dateRange as DateRangeFilter) || { from: '', to: '' },
    });
    setPage(1);
    setSelectedUsers([]);
  };

  const handleFiltersReset = () => {
    setFilters({
      search: '',
      roles: [],
      statuses: [],
      dateRange: { from: '', to: '' },
    });
    setPage(1);
    setSelectedUsers([]);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const columns: Column<User>[] = [
    {
      header: ({ table }: { table: TableInstance }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row, table }: { row: User; table: TableInstance & { getRowProps: (row: User) => { getIsSelected: () => boolean; getToggleSelectedHandler: () => () => void } } }) => {
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
      accessorKey: 'name' as keyof User,
      cell: ({ row }: { row: User }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            {row.name ? row.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div className="font-medium">{row.name || 'Unnamed User'}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: () => (
        <button
          onClick={() => handleSort('role')}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          Role
          <span className="inline-flex">
            {sortBy === 'role' ? (
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
      accessorKey: 'role' as keyof User,
      cell: ({ row }: { row: User }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.role === 'admin' 
            ? 'bg-purple-100 text-purple-700' 
            : row.role === 'moderator'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.role}
        </span>
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
      accessorKey: 'status' as keyof User,
      cell: ({ row }: { row: User }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.status === 'active' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
          }`}
        >
          {row.status}
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
      accessorKey: 'createdAt' as keyof User,
      cell: ({ row }: { row: User }) => (
        <span className="text-sm text-gray-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: User }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/users/${row.id}`)}
            disabled={isLoadingUserOperation}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {row.status === 'active' ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleStatusChange(row.id, 'banned')}
              disabled={isLoadingUserOperation}
            >
              <Ban className="h-4 w-4 mr-1" />
              Ban
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(row.id, 'active')}
              disabled={isLoadingUserOperation}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Unban
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendEmail(row.id)}
            disabled={isLoadingUserOperation}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load users</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isLoadingUserOperation}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push('/users/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
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
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            {selectedUsers.length} users selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange('active')}
              disabled={isLoadingUserOperation}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Unban All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange('banned')}
              disabled={isLoadingUserOperation}
            >
              <Ban className="h-4 w-4 mr-2" />
              Ban All
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoadingUserOperation}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-gray-200">
        <Table
          data={data?.users || []}
          columns={columns}
          isLoading={isLoading}
          selection={{
            selectedRows: selectedUsers,
            onSelectedRowsChange: setSelectedUsers,
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