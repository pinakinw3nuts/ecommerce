import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Parse the form data
    const formData = await req.formData();
    const addressId = formData.get('addressId') as string;
    const shippingId = formData.get('shippingId') as string;
    const paymentId = formData.get('paymentId') as string;
    
    // Validate required parameters
    if (!addressId || !shippingId || !paymentId) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }
    
    // Get authentication token
    const token = cookies().get('access_token')?.value;
    
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // In a real implementation, we would call the orders service to place the order
    // For now, we'll just simulate a successful order creation
    
    // Generate a random order ID
    const orderId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Clear the cart cookie since the order has been placed
    cookies().set('cart', JSON.stringify({ items: [] }), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    
    // Redirect to the order confirmation page
    return NextResponse.redirect(new URL(`/orders/confirmation?orderId=${orderId}`, req.url), 303);
  } catch (error) {
    console.error('Error placing order:', error);
    return new NextResponse('Failed to place order', { status: 500 });
  }
} 