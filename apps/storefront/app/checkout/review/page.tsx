'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  total: number;
};

type OrderPreview = {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
};

// Mock order preview data for demonstration
function getMockOrderPreview(shippingId: string): OrderPreview {
  const shippingCost = shippingId === 'express' ? 12.99 : 4.99;
  
  return {
    items: [
      {
        id: "item1",
        name: "Classic T-Shirt",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop",
        price: 19.99,
        quantity: 2,
        total: 39.98
      },
      {
        id: "item2",
        name: "Wireless Headphones",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1470&auto=format&fit=crop",
        price: 89.99,
        quantity: 1,
        total: 89.99
      }
    ],
    subtotal: 129.97,
    tax: 10.40,
    shipping: shippingCost,
    total: 129.97 + 10.40 + shippingCost
  };
}

// Separate the core component logic
function ReviewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const addressId = searchParams.get('addressId');
  const shippingId = searchParams.get('shippingId');
  const paymentId = searchParams.get('paymentId');
  
  useEffect(() => {
    if (!addressId || !shippingId || !paymentId) {
      router.push('/checkout/address');
    }
  }, [addressId, shippingId, paymentId, router]);

  // Return early if missing required parameters
  if (!addressId || !shippingId || !paymentId) {
    return null;
  }

  const preview = getMockOrderPreview(shippingId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Review & Confirm</h1>

      <div className="space-y-4">
        {preview.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border-b pb-2">
            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-600">
                ${item.price} × {item.quantity}
              </div>
            </div>
            <div className="text-sm font-semibold">${item.total.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t pt-4 space-y-1 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${preview.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>${preview.shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${preview.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-black text-base pt-2">
          <span>Total</span>
          <span>${preview.total.toFixed(2)}</span>
        </div>
      </div>

      <form action="/api/checkout/place" method="POST" className="mt-6">
        <input type="hidden" name="addressId" value={addressId} />
        <input type="hidden" name="shippingId" value={shippingId} />
        <input type="hidden" name="paymentId" value={paymentId} />
        <button type="submit" className="bg-black text-white px-6 py-2 rounded w-full">
          Place Order
        </button>
      </form>
    </div>
  );
}

// Loading fallback
function ReviewPageLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b pb-2">
            <div className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t pt-4 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/12 animate-pulse"></div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewPageLoading />}>
      <ReviewPageContent />
    </Suspense>
  );
} 