'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { format } from 'date-fns';
import Table from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Eye } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Order {
  id: string;
  customerName: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
  }>;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'processing':
      return 'bg-blue-100 text-blue-700';
    case 'shipped':
      return 'bg-purple-100 text-purple-700';
    case 'delivered':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useSWR<{
    orders: Order[];
    total: number;
  }>(`/api/orders?page=${page}`, fetcher);
  const toast = useToast();
  const [isLoadingStatusUpdate, setIsLoadingStatusUpdate] = useState(false);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsLoadingStatusUpdate(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsLoadingStatusUpdate(false);
    }
  };

  const columns = [
    {
      header: 'Order ID',
      accessorKey: 'id' as keyof Order,
      cell: (row: Order) => (
        <button
          onClick={() => router.push(`/orders/${row.id}`)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          #{row.id}
        </button>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customerName' as keyof Order,
    },
    {
      header: 'Total',
      accessorKey: 'total' as keyof Order,
      cell: (row: Order) => (
        <span className="font-medium">
          ${row.total.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status' as keyof Order,
      cell: (row: Order) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'createdAt' as keyof Order,
      cell: (row: Order) => (
        <span className="text-gray-500">
          {format(new Date(row.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions' as keyof Order,
      cell: (row: Order) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.success('Order details feature coming soon');
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <select
            className="block w-32 rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            value={row.status}
            onChange={(e) => handleUpdateStatus(row.id, e.target.value)}
            disabled={isLoadingStatusUpdate}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track all customer orders
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          data={data?.orders ?? []}
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