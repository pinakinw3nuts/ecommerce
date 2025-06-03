import { NextRequest, NextResponse } from 'next/server';

// Mock wishlist data store
const wishlistItems: string[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const productId = body.get('productId')?.toString();

    if (!productId) {
      return new NextResponse('Product ID is required', { status: 400 });
    }

    // For demo purposes, we'll just add the product ID to our mock wishlist
    // In a real implementation, we would store this in a database
    if (!wishlistItems.includes(productId)) {
      wishlistItems.push(productId);
    }
    
    console.log('Added to wishlist:', productId);
    console.log('Current wishlist:', wishlistItems);

    // Get the referer or use the base URL as fallback
    const referer = req.headers.get('referer');
    
    // Use an absolute URL for redirect
    const url = referer ? new URL(referer) : new URL('/', req.url);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    return new NextResponse('Failed to add to wishlist', { status: 500 });
  }
}