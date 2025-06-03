import { NextRequest, NextResponse } from 'next/server';

// Mock wishlist data
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

export async function GET(req: NextRequest) {
  try {
    // For demo purposes, we'll return mock data
    // In a real implementation, we would fetch from a database
    return NextResponse.json(mockWishlistItems);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    return new NextResponse('Failed to fetch wishlist', { status: 500 });
  }
} 