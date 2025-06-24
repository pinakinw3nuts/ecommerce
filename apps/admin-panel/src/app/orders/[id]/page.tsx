'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { format } from 'date-fns';
import { Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OrderService } from '@/services/orders';
import { useToast } from '@/hooks/useToast';
import { Order, OrderStatus, OrderNote } from '@/types/orders';

// Create a singleton order service instance
const orderService = new OrderService();

// Custom fetcher that uses the OrderService
const fetcher = async (url: string) => {
  const id = url.split('/').pop();
  if (!id) throw new Error('Invalid URL');
  return await orderService.getOrderById(id);
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newNote, setNewNote] = useState('');

  const { data: order, error, mutate } = useSWR<Order>(`/api/order-service/orders/${params.id}`, fetcher);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      setIsUpdating(true);
      await orderService.updateOrderStatus(params.id, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      mutate();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      setIsUpdating(true);
      await orderService.cancelOrder(params.id, 'Cancelled by admin');
      toast.success('Order has been cancelled');
      mutate();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setIsUpdating(true);
      await orderService.addOrderNote(params.id, newNote);
      toast.success('Note added to order');
      setNewNote('');
      mutate();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
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
      <div className="flex items-center justify-between">
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
            Order #{order.orderNumber || order.id.substring(0, 8)}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {order.status !== OrderStatus.CANCELLED && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Order Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Customer</dt>
              <dd className="text-sm font-medium">{order.customerName || 'N/A'}</dd>
              <dd className="text-sm text-gray-600">{order.customerEmail || order.userId}</dd>
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
                  onChange={(e) => handleStatusUpdate(e.target.value as OrderStatus)}
                  disabled={isUpdating || order.status === OrderStatus.CANCELLED}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={OrderStatus.PENDING}>Pending</option>
                  <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                  <option value={OrderStatus.PROCESSING}>Processing</option>
                  <option value={OrderStatus.SHIPPED}>Shipped</option>
                  <option value={OrderStatus.DELIVERED}>Delivered</option>
                  <option value={OrderStatus.CANCELLED}>Cancelled</option>
                  <option value={OrderStatus.FAILED}>Failed</option>
                </select>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Shipping Information</h2>
          <address className="not-italic">
            <p className="text-sm">{order.shippingAddress.street}</p>
            <p className="text-sm">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
            <p className="text-sm">{order.shippingAddress.country}</p>
          </address>
          
          {order.trackingNumber && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Tracking Number</p>
              <p className="text-sm font-medium">{order.trackingNumber}</p>
            </div>
          )}
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-md mr-4"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      {item.variantName && (
                        <div className="text-sm text-gray-500">Variant: {item.variantName}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${item.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                Subtotal
              </td>
              <td className="px-6 py-3 text-sm text-gray-900">
                ${order.subtotal.toFixed(2)}
              </td>
            </tr>
            {order.shippingAmount > 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Shipping
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  ${order.shippingAmount.toFixed(2)}
                </td>
              </tr>
            )}
            {order.taxAmount > 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Tax
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  ${order.taxAmount.toFixed(2)}
                </td>
              </tr>
            )}
            {order.discountAmount > 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Discount
                </td>
                <td className="px-6 py-3 text-sm text-gray-900 text-red-600">
                  -${order.discountAmount.toFixed(2)}
                </td>
              </tr>
            )}
            <tr className="border-t border-gray-200">
              <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">
                ${order.totalAmount.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Order Notes */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Notes</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {order.notes?.length ? (
            order.notes.map((note) => (
              <div key={note.id} className="p-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">
                    {note.authorName || note.authorId}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(note.createdAt), 'PPp')}
                  </span>
                </div>
                <p className="text-sm">{note.content}</p>
                {note.isInternal && (
                  <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Internal Note
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">No notes yet</div>
          )}

          <div className="p-6 bg-gray-50">
            <h3 className="text-sm font-medium mb-3">Add a note</h3>
            <div className="flex flex-col space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[100px] rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add an internal note visible to staff only..."
                disabled={isUpdating}
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isUpdating}
              >
                <Save className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 