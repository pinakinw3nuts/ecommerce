import { NextRequest, NextResponse } from 'next/server';

// Import the mockCart from the cart/items route
import { mockCart } from '../items/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const productId = body.get('productId');
    
    if (!productId) {
      return new NextResponse('Product ID is required', { status: 400 });
    }

    // For demo purposes, we'll just simulate a successful addition to cart
    // In a real implementation, we would add the item to a database or cart service
    console.log(`Added product ${productId} to cart`);

    // Get the referer or use the base URL as fallback
    const referer = req.headers.get('referer');
    
    // Use an absolute URL for redirect
    const url = referer ? new URL(referer) : new URL('/', req.url);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error('Error adding to cart:', err);
    return new NextResponse('Failed to add to cart', { status: 500 });
  }
} 