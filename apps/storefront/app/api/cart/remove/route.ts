import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const itemId = body.get('itemId');

    if (!itemId) {
      return new NextResponse('Missing item ID', { status: 400 });
    }

    // For demo purposes, we'll just simulate a successful removal
    // In a real implementation, we would remove the item from a database or cart service
    console.log(`Removed cart item ${itemId}`);

    // Use an absolute URL for redirect
    const url = new URL('/cart', req.url);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error('Error removing cart item:', err);
    return new NextResponse('Failed to remove cart item', { status: 500 });
  }
} 