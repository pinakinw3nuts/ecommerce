import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const { orderId } = searchParams;

  if (!orderId) {
    redirect('/');
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 text-3xl mb-6">
          ✓
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
        <p className="text-gray-600">
          Your order #{orderId} has been successfully placed.
        </p>
      </div>

      <div className="border rounded-lg p-6 mb-8 text-left">
        <h2 className="font-medium mb-4">What happens next?</h2>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="text-green-600">✓</span>
            <span>You'll receive an order confirmation email</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600">○</span>
            <span>Your items will be prepared for shipping</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600">○</span>
            <span>You'll receive tracking information when your order ships</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <Link href="/orders" className="block bg-black text-white px-6 py-3 rounded-md">
          View Order Details
        </Link>
        <Link href="/" className="block text-sm underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
} 