'use client';

import { useState, useEffect } from 'react';
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

// Custom fetcher that uses the API directly
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status} ${response.statusText}`);
  }
  
  const orderData = await response.json();
  
  // Calculate subtotal if it's missing or zero
  if (!orderData.subtotal && orderData.items && Array.isArray(orderData.items)) {
    let total = 0;
    for (const item of orderData.items) {
      total += (item.price || 0) * (item.quantity || 0);
    }
    orderData.subtotal = total;
  }
  
  console.log('Fetched order data:', orderData);
  console.log('Notes:', orderData.notes);
  
  return orderData;
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);

  // Use useEffect to properly handle params.id
  useEffect(() => {
    // Async function to resolve params
    const setOrderIdFromParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setOrderId(resolvedParams.id);
    };
    
    setOrderIdFromParams();
  }, [params]);

  // Only create the SWR hook when orderId is available
  const { data: order, error, mutate } = useSWR<Order>(
    orderId ? `/api/orders/${orderId}` : null, 
    fetcher
  );

  // Fallback to fetch notes if they're not in the order data
  const { data: notesData } = useSWR(
    order && (!order.notes || order.notes.length === 0) ? 
      `/api/orders/${orderId}/notes` : null,
    async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error('Failed to fetch notes:', response.status, response.statusText);
          return [];
        }
        const data = await response.json();
        console.log('Fetched notes separately:', data);
        return data;
      } catch (error) {
        console.error('Error fetching notes:', error);
        return [];
      }
    }
  );

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!orderId) {
      console.error('No order ID available for status update');
      toast.error('Cannot update: No order ID available');
      return;
    }
    
    // Don't update if status is the same
    if (order && order.status === newStatus) {
      console.log('Status already set to', newStatus);
      toast.info(`Order already has status: ${newStatus}`);
      return;
    }
    
    try {
      setIsUpdating(true);
      console.log('Updating order status to:', newStatus);
      console.log('Order ID:', orderId);
      
      // Make a direct fetch request to bypass any potential service issues
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to update status: ${response.status} ${response.statusText}`);
      }
      
      const updatedOrder = await response.json();
      console.log('Update successful, new order data:', updatedOrder);
      
      // Update the local order data immediately without waiting for revalidation
      if (order) {
        // Create a copy of the order with the updated status
        const updatedLocalOrder = {
          ...order,
          status: newStatus
        };
        
        // Update the SWR cache with the new order data
        mutate(updatedLocalOrder, { revalidate: false });
        
        // Then trigger a background revalidation to get the complete updated data
        setTimeout(() => {
          mutate(undefined, { revalidate: true });
        }, 300);
      }
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(`Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!orderId) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      setIsUpdating(true);
      await orderService.cancelOrder(orderId, 'Cancelled by admin');
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
    if (!orderId || !newNote.trim()) return;

    try {
      setIsUpdating(true);
      await orderService.addOrderNote(orderId, newNote);
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
              {order.customerName ? (
                <dd className="text-sm font-medium">{order.customerName}</dd>
              ) : (
                <dd className="text-sm font-medium text-gray-400">N/A</dd>
              )}
              
              {order.customerEmail && (
                <dd className="text-sm text-gray-600">
                  <a href={`mailto:${order.customerEmail}`} className="hover:underline">
                    {order.customerEmail}
                  </a>
                </dd>
              )}
              
              {order.customerPhone && (
                <dd className="text-sm text-gray-600">
                  <a href={`tel:${order.customerPhone}`} className="hover:underline">
                    {order.customerPhone}
                  </a>
                </dd>
              )}
              
              {!order.customerName && !order.customerEmail && !order.customerPhone && (
                <dd className="text-sm text-gray-500">
                  <span className="font-medium">User ID:</span> {order.userId}
                </dd>
              )}
            </div>
            <div>
              <dt className="text-sm text-gray-500">Date</dt>
              <dd className="text-sm font-medium">
                {format(new Date(order.createdAt), 'PPpp')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="mt-1 space-y-3">
                {/* Original dropdown */}
                <div className="flex items-center gap-3">
                  <select
                    value={order.status}
                    onChange={(e) => {
                      console.log('Selected status:', e.target.value);
                      handleStatusUpdate(e.target.value as OrderStatus);
                    }}
                    disabled={isUpdating}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={OrderStatus.PENDING}>Pending</option>
                    <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                    <option value={OrderStatus.SHIPPED}>Shipped</option>
                    <option value={OrderStatus.DELIVERED}>Delivered</option>
                    <option value={OrderStatus.CANCELLED}>Cancelled</option>
                    <option value={OrderStatus.FAILED}>Failed</option>
                  </select>
                </div>
                
                {/* Alternative status buttons for testing */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdating || order.status === OrderStatus.CONFIRMED}
                    onClick={() => handleStatusUpdate(OrderStatus.CONFIRMED)}
                  >
                    Set Confirmed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdating || order.status === OrderStatus.SHIPPED}
                    onClick={() => handleStatusUpdate(OrderStatus.SHIPPED)}
                  >
                    Set Shipped
                  </Button>
                </div>
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
                  ${item.price ? item.price.toFixed(2) : '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${item.price && item.quantity ? (item.price * item.quantity).toFixed(2) : '0.00'}
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
                ${(order.subtotal || order.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)).toFixed(2)}
              </td>
            </tr>
            {order.shippingAmount > 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Shipping
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  ${order.shippingAmount ? order.shippingAmount.toFixed(2) : '0.00'}
                </td>
              </tr>
            )}
            {order.taxAmount > 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Tax
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  ${order.taxAmount ? order.taxAmount.toFixed(2) : '0.00'}
                </td>
              </tr>
            )}
            {order.discountAmount > 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Discount
                </td>
                <td className="px-6 py-3 text-sm text-gray-900 text-red-600">
                  -${order.discountAmount ? order.discountAmount.toFixed(2) : '0.00'}
                </td>
              </tr>
            )}
            <tr className="border-t border-gray-200">
              <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">
                ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
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
          {(order.notes && order.notes.length > 0) || (notesData && notesData.length > 0) ? (
            ((order.notes && order.notes.length > 0) ? order.notes : (notesData || [])).map((note: OrderNote) => (
              <div key={note.id} className="p-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">
                    {note.authorName || note.authorId || 'System'}
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