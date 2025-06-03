import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const addressId = body.get('addressId');
    const shippingId = body.get('shippingId');
    const paymentId = body.get('paymentId');

    if (!addressId || !shippingId || !paymentId) {
      return new NextResponse('Missing checkout data', { status: 400 });
    }

    // For demo purposes, we'll just simulate a successful order placement
    // In a real implementation, we would create an order in a database or order service
    
    // Generate a random order ID
    const orderId = 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    console.log('Order placed:', {
      orderId,
      addressId,
      shippingId,
      paymentId
    });

    // Use an absolute URL for redirect
    const url = new URL(`/account/orders/${orderId}`, req.url);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error('[PLACE_ORDER_ERROR]', err);
    return new NextResponse('Failed to place order', { status: 500 });
  }
}