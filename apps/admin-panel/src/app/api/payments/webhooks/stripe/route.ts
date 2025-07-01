import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3007';

// This route is specifically for Stripe webhooks
export async function POST(request: NextRequest) {
  try {
    // Read request body as raw text for signature validation
    const rawBody = await request.text();
    
    // Get Stripe signature header
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ message: 'Missing Stripe signature' }, { status: 400 });
    }

    console.log('Received Stripe webhook, forwarding to payment service');
    
    // Forward to payment service with original signature for verification
    const apiUrl = `${PAYMENT_SERVICE_URL}/api/v1/payments/webhooks/stripe`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'stripe-signature': signature,
      },
      body: rawBody,
    });

    if (!response.ok) {
      console.error('Error response from Stripe webhook processing:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to process Stripe webhook',
          error: errorData,
        },
        { status: response.status },
      );
    }

    // Return 200 success to Stripe
    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
} 