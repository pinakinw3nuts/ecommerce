import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const { orderId } = searchParams;

  if (!orderId) {
    redirect('/');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 text-2xl mb-4">
          ✓
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-gray-600">
          Thank you for your purchase. Your order has been received.
        </p>
      </div>

      <div className="border rounded p-6 mb-8">
        <div className="mb-4">
          <div className="text-sm text-gray-500">Order Number</div>
          <div className="font-medium">{orderId}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Estimated Delivery</div>
          <div className="font-medium">
            {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Link href="/orders" className="block bg-black text-white px-6 py-2 rounded">
          View Order Status
        </Link>
        <Link href="/" className="block text-sm underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
} 