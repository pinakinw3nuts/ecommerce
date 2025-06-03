import { NextRequest, NextResponse } from 'next/server';

// Mock cart data
const mockCart = {
  items: [
    {
      id: "ci1",
      productId: "classic-t-shirt",
      name: "Classic T-Shirt",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop",
      price: 19.99,
      quantity: 2,
      total: 39.98
    },
    {
      id: "ci2",
      productId: "wireless-headphones",
      name: "Wireless Headphones",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1470&auto=format&fit=crop",
      price: 89.99,
      quantity: 1,
      total: 89.99
    }
  ],
  subtotal: 129.97
};

// Empty cart
const emptyCart = {
  items: [],
  subtotal: 0
};

export async function GET(req: NextRequest) {
  // For demo purposes, we'll always return the mock cart
  // In a real implementation, this would fetch the cart from the cart service
  // based on the user's authentication token
  
  return NextResponse.json(mockCart);
} 