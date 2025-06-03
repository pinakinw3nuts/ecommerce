import { NextRequest, NextResponse } from 'next/server';

// Import the mock wishlist data store from the add route
// Note: This is just for demo purposes. In a real app, we'd use a database.
// Since this is server-side code that gets reloaded on each request,
// we'll declare the wishlist items here too
const wishlistItems: string[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const productId = body.get('productId')?.toString();

    if (!productId) {
      return new NextResponse('Product ID is required', { status: 400 });
    }

    // For demo purposes, we'll just remove the product ID from our mock wishlist
    // In a real implementation, we would remove it from a database
    const index = wishlistItems.indexOf(productId);
    if (index > -1) {
      wishlistItems.splice(index, 1);
    }
    
    console.log('Removed from wishlist:', productId);
    console.log('Current wishlist:', wishlistItems);

    // Use an absolute URL for redirect
    const url = new URL('/account/wishlist', req.url);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    return new NextResponse('Failed to remove item', { status: 500 });
  }
} 