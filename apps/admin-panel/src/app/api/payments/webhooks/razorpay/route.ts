import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3007';

// This route is specifically for Razorpay webhooks
export async function POST(request: NextRequest) {
  try {
    // Get the Razorpay signature from headers
    const razorpaySignature = request.headers.get('x-razorpay-signature');
    
    if (!razorpaySignature) {
      console.error('Missing Razorpay signature');
      return NextResponse.json({ message: 'Missing signature' }, { status: 400 });
    }

    // Parse the request body
    const body = await request.text();
    
    console.log('Received Razorpay webhook, forwarding to payment service');
    
    // Forward to payment service with original signature for verification
    const apiUrl = `${PAYMENT_SERVICE_URL}/api/v1/payments/webhooks/razorpay`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'x-razorpay-signature': razorpaySignature,
      },
      body: body,
    });

    if (!response.ok) {
      console.error('Error response from Razorpay webhook processing:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to process Razorpay webhook',
          error: errorData,
        },
        { status: response.status },
      );
    }

    // Return 200 success to Razorpay
    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.error('Error processing Razorpay webhook:', error);
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
} 