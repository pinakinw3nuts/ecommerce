'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

type CartItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  total: number;
};

type CartResponse = {
  items: CartItem[];
  subtotal: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axios.get('/api/cart');
        setCart(response.data);
      } catch (error) {
        console.error('Error fetching cart:', error);
        // Set empty cart in case of error
        setCart({ items: [], subtotal: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  if (loading) {
    return <div className="p-4">Loading your cart...</div>;
  }

  if (!cart) {
    return <div className="p-4">Failed to load cart. Please try again later.</div>;
  }

  const { items, subtotal } = cart;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {items.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">${item.price.toFixed(2)} × {item.quantity}</div>
                  <div className="text-sm text-gray-700 mt-1">Total: ${item.total.toFixed(2)}</div>

                  <form action="/api/cart/update" method="POST" className="mt-2 flex items-center gap-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="number" name="quantity" defaultValue={item.quantity} min="1" className="w-16 border p-1 text-sm" />
                    <button type="submit" className="text-sm px-3 py-1 bg-black text-white rounded">Update</button>
                  </form>

                  <form action="/api/cart/remove" method="POST" className="mt-1">
                    <input type="hidden" name="itemId" value={item.id} />
                    <button type="submit" className="text-xs text-red-500 hover:underline">Remove</button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t pt-4 text-right space-y-2">
            <div className="text-lg font-semibold">Subtotal: ${subtotal.toFixed(2)}</div>
            <Link href="/checkout" className="inline-block bg-black text-white px-6 py-2 rounded">
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 