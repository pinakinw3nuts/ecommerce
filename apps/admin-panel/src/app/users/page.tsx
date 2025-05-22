'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Ban, UserCheck, Users as UsersIcon, Mail } from 'lucide-react';
import Table from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'banned';
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function UsersPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, error, isLoading, mutate } = useSWR<{
    users: User[];
    total: number;
  }>(`/api/users?page=${page}`, fetcher);
  const [isLoadingUserOperation, setIsLoadingUserOperation] = useState(false);

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

      // Refresh the data
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsLoadingUserOperation(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name' as keyof User,
      cell: (row: User) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role' as keyof User,
      cell: (row: User) => (
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
      header: 'Status',
      accessorKey: 'status' as keyof User,
      cell: (row: User) => (
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
      header: 'Actions',
      cell: (row: User) => (
        <div className="flex items-center gap-2">
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
        <Button onClick={() => router.push('/users/new')}>
          Add User
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          data={data?.users ?? []}
          columns={columns}
          isLoading={isLoading}
          pagination={{
            page,
            pageSize: 10,
            total: data?.total ?? 0,
            onPageChange: setPage,
          }}
        />
      </div>
    </div>
  );
} 