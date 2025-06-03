import { NextRequest, NextResponse } from 'next/server';

// Mock cart data store
export let mockCart: Array<{ productId: string; quantity: number }> = [];

export async function GET(req: NextRequest) {
  try {
    // For demo purposes, allow getting cart without authentication
    // In a real app, you would require authentication here
    
    return NextResponse.json(mockCart);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return new NextResponse('Failed to fetch cart items', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // For demo purposes, allow adding to cart without authentication
    // In a real app, you would require authentication here
    
    // Parse the request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.productId) {
      return new NextResponse('Product ID is required', { status: 400 });
    }
    
    const quantity = body.quantity || 1;
    
    // Check if the product is already in the cart
    const existingItemIndex = mockCart.findIndex(item => item.productId === body.productId);
    
    if (existingItemIndex !== -1) {
      // Update quantity if the product is already in the cart
      mockCart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      mockCart.push({
        productId: body.productId,
        quantity: quantity
      });
    }
    
    return NextResponse.json({
      message: 'Product added to cart',
      cart: mockCart
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return new NextResponse('Failed to add item to cart', { status: 500 });
  }
} 