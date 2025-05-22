'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { format } from 'date-fns';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface ShippingInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  notes: string[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const { data: order, error, mutate } = useSWR<Order>(`/api/orders/${params.id}`, fetcher);

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/orders/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      mutate();
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    await handleStatusUpdate('cancelled');
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/orders/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });

      if (!response.ok) throw new Error('Failed to add note');
      setNewNote('');
      mutate();
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load order details</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">
          Order #{order.id}
        </h1>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Order Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Customer</dt>
              <dd className="text-sm font-medium">{order.customerName}</dd>
              <dd className="text-sm text-gray-600">{order.customerEmail}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Date</dt>
              <dd className="text-sm font-medium">
                {format(new Date(order.createdAt), 'PPpp')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="flex items-center gap-3 mt-1">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(e.target.value as Order['status'])}
                  disabled={isUpdating || order.status === 'cancelled'}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {order.status !== 'cancelled' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    Cancel Order
                  </Button>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Shipping Information</h2>
          <address className="not-italic">
            <p className="text-sm">{order.shippingInfo.address}</p>
            <p className="text-sm">
              {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zipCode}
            </p>
            <p className="text-sm">{order.shippingInfo.country}</p>
          </address>
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Order Items</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {item.productName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${item.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${(item.quantity * item.price).toFixed(2)}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td colSpan={3} className="px-6 py-4 text-sm font-medium text-right">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${order.total.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Internal Notes */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium mb-4">Internal Notes</h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button
              onClick={handleAddNote}
              disabled={isUpdating || !newNote.trim()}
            >
              Add Note
            </Button>
          </div>
          <div className="space-y-3">
            {order.notes.map((note, index) => (
              <div
                key={index}
                className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600"
              >
                {note}
              </div>
            ))}
            {order.notes.length === 0 && (
              <p className="text-sm text-gray-500">No notes yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 