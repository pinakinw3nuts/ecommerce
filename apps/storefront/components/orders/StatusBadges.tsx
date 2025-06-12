import { Badge } from '@/components/ui/Badge';
import { Order } from '@/lib/types/order';

export function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const variants: Record<Order['status'], { color: string; text: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-800', text: 'Processing' },
    shipped: { color: 'bg-purple-100 text-purple-800', text: 'Shipped' },
    delivered: { color: 'bg-green-100 text-green-800', text: 'Delivered' },
    cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
  };

  const { color, text } = variants[status];
  return <Badge className={`${color} px-2 py-1 text-xs font-medium rounded`}>{text}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: Order['paymentStatus'] }) {
  const variants: Record<Order['paymentStatus'], { color: string; text: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
    paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
    failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
    refunded: { color: 'bg-gray-100 text-gray-800', text: 'Refunded' },
  };

  const { color, text } = variants[status];
  return <Badge className={`${color} px-2 py-1 text-xs font-medium rounded`}>{text}</Badge>;
}
