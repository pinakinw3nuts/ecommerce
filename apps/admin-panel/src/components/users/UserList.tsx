'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { Portal } from '@radix-ui/react-portal';
import { 
  Loader2, 
  Search, 
  SlidersHorizontal, 
  Download, 
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  Pencil,
  Ban,
  CheckSquare
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Checkbox } from '@/components/ui/Checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'banned';
  createdAt: string;
}

interface PaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

interface ApiResponse {
  users: User[];
  pagination: PaginationData;
}

export default function UserList() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    hasMore: false,
    hasPrevious: false,
  });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);

  // Fetch users from the API
  const fetchUsers = useCallback(async () => {
    if (!pagination) return;
    
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(pagination.currentPage),
        pageSize: String(pagination.pageSize),
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(role && role !== 'all' && { role }),
        ...(status && status !== 'all' && { status })
      });

      const response = await fetch(`/api/users?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
          // Get the current URL to redirect back after login
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?returnUrl=${returnUrl}`;
          return;
        }
        throw new Error(data.message || 'Failed to fetch users');
      }

      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error: any) {
      showError(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [pagination?.currentPage, pagination?.pageSize, search, role, status, sortBy, sortOrder, showError]);

  // Add useEffect to fetch users
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle API operations
  const handleApiOperation = async (operation: () => Promise<Response>, successMessage: string) => {
    try {
      setIsLoadingOperation(true);
      const response = await operation();
      if (!response.ok) throw new Error(`Failed to ${successMessage.toLowerCase()}`);
      
      success(successMessage);
      fetchUsers();
      return true;
    } catch (error) {
      console.error(`Error: ${successMessage.toLowerCase()}:`, error);
      showError(`Failed to ${successMessage.toLowerCase()}`);
      return false;
    } finally {
      setIsLoadingOperation(false);
    }
  };

  // Handle bulk actions
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedUsers.length === 0) return;
    
    await handleApiOperation(
      () => fetch('/api/users/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers, status: newStatus }),
      }),
      'Users status updated successfully'
    );
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0 || !confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;
    
    const success = await handleApiOperation(
      () => fetch('/api/users/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers }),
      }),
      'Users deleted successfully'
    );
    
    if (success) {
      setSelectedUsers([]);
    }
  };

  // Handle export
  const handleExport = () => {
    const queryParams = new URLSearchParams({
      ...(search && { search }),
      ...(role && role !== 'all' && { role }),
      ...(status && status !== 'all' && { status }),
      format: 'csv'
    });
    
    window.location.href = `/api/users/export?${queryParams.toString()}`;
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ChevronsUpDown className="h-4 w-4" />;
    return sortOrder === 'ASC' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="flex items-center gap-2">
          {selectedUsers.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Actions ({selectedUsers.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('banned')}>
                  <Ban className="h-4 w-4 mr-2" />
                  Set Banned
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push('/users/new')}>
            Add User
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              className="pl-9 w-full"
            />
          </div>
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {(role !== 'all' || status !== 'all') && (
                  <span className="ml-1 rounded-full bg-primary w-2 h-2" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 z-50" align="end" sideOffset={5}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filters</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={role}
                      onValueChange={(value) => {
                        setRole(value);
                        setPagination(prev => ({ ...prev, currentPage: 1 }));
                      }}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent 
                        ref={(ref) => {
                          if (ref) {
                            ref.style.zIndex = '9999';
                          }
                        }}
                        position="popper"
                        className="min-w-[200px]"
                        side="bottom"
                        align="start"
                        sideOffset={5}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="USER">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => {
                        setStatus(value);
                        setPagination(prev => ({ ...prev, currentPage: 1 }));
                      }}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent 
                        ref={(ref) => {
                          if (ref) {
                            ref.style.zIndex = '9999';
                          }
                        }}
                        position="popper"
                        className="min-w-[200px]"
                        side="bottom"
                        align="start"
                        sideOffset={5}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRole('all');
                      setStatus('all');
                      setPagination(prev => ({ ...prev, currentPage: 1 }));
                      setIsFilterOpen(false);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      fetchUsers();
                      setIsFilterOpen(false);
                    }}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onCheckedChange={() => {
                    setSelectedUsers(prev => 
                      prev.length === users.length ? [] : users.map(user => user.id)
                    );
                  }}
                />
              </TableHead>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Name {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('email')} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Email {getSortIcon('email')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('role')} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Role {getSortIcon('role')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Status {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('createdAt')} className="text-right cursor-pointer">
                <div className="flex items-center justify-end gap-1">
                  Created At {getSortIcon('createdAt')}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : !users || users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => {
                        setSelectedUsers(prev => 
                          prev.includes(user.id)
                            ? prev.filter(id => id !== user.id)
                            : [...prev, user.id]
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      user.role.toLowerCase() === 'admin' 
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : user.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/users/${user.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this user?')) {
                            handleApiOperation(
                              () => fetch(`/api/users/${user.id}`, { method: 'DELETE' }),
                              'User deleted successfully'
                            ).then(success => {
                              if (success) {
                                setSelectedUsers(prev => prev.filter(id => id !== user.id));
                              }
                            });
                          }
                        }}
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

      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            {pagination ? `Page ${pagination.currentPage} of ${pagination.totalPages}` : 'Loading...'}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={!pagination?.hasPrevious || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={!pagination?.hasMore || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 