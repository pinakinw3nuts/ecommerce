import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3007';

// This route doesn't require authentication as it's used by payment providers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiUrl = `${PAYMENT_SERVICE_URL}/api/v1/payments/webhooks`;

    console.log('Received payment webhook:', {
      provider: body.provider,
      eventType: body.eventType || body.type || 'unknown'
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Error response from webhook processing:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to process webhook',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// List webhooks (admin only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Log the query parameters for debugging
    console.log('Query parameters:', Object.fromEntries(searchParams.entries()));
    
    const apiUrl = `${PAYMENT_SERVICE_URL}/api/v1/payments/admin/webhooks?${searchParams.toString()}`;
    console.log('Sending request to:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      console.error('Error response from payment service:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to fetch webhook logs',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();
    
    // Transform the response to match the expected format in the admin panel
    const transformedData = {
      webhooks: responseData.data,
      pagination: {
        total: responseData.total,
        totalPages: Math.ceil(responseData.total / responseData.pageSize),
        currentPage: responseData.page,
        pageSize: responseData.pageSize
      }
    };
    
    return NextResponse.json(transformedData);
  } catch (error: any) {
    console.error('Error fetching webhook logs:', error);
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
} 