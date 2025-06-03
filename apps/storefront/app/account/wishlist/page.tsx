'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@lib/api';

type WishlistItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
};

// Mock wishlist data for demo purposes
const mockWishlistItems = [
  {
    id: 'w1',
    productId: 'p1',
    name: 'Classic T-Shirt',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop',
    slug: 'classic-t-shirt'
  },
  {
    id: 'w2',
    productId: 'p2',
    name: 'Wireless Headphones',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1470&auto=format&fit=crop',
    slug: 'wireless-headphones'
  }
];

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For demo purposes, we'll use mock data
    // In a real implementation, we would fetch from the API
    setWishlist(mockWishlistItems);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-4">Loading your wishlist...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Your Wishlist</h1>

      {wishlist.length === 0 ? (
        <p className="text-gray-600">You haven't added any products to your wishlist yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="border p-4 rounded shadow-sm">
              <Link href={`/products/${item.slug}`}>
                <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded mb-2" />
                <div className="font-medium">{item.name}</div>
                <div className="text-gray-600 text-sm">${item.price.toFixed(2)}</div>
              </Link>
              <form action="/api/wishlist/remove" method="POST" className="mt-3">
                <input type="hidden" name="productId" value={item.productId} />
                <button type="submit" className="text-sm text-red-600 underline">Remove</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 