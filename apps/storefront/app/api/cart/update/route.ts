import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const itemId = body.get('itemId');
    const quantity = Number(body.get('quantity'));

    if (!itemId || !quantity || quantity < 1) {
      return new NextResponse('Invalid quantity or item ID', { status: 400 });
    }

    // For demo purposes, we'll just simulate a successful update
    // In a real implementation, we would update the cart in a database or cart service
    console.log(`Updated cart item ${itemId} to quantity ${quantity}`);

    // Use an absolute URL for redirect
    const url = new URL('/cart', req.url);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error('Error updating cart item:', err);
    return new NextResponse('Failed to update cart item', { status: 500 });
  }
} 