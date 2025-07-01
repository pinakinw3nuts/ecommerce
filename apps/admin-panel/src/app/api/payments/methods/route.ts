import { NextRequest, NextResponse } from 'next/server';
import { getAdminToken } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3007';

export async function GET(request: NextRequest) {
  try {
    const token = await getAdminToken();

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Log the query parameters for debugging
    console.log('Query parameters:', Object.fromEntries(searchParams.entries()));
    
    // Special handling for isActive parameter to ensure it's passed correctly
    const isActiveParam = searchParams.get('isActive');
    if (isActiveParam !== null) {
      // Make sure it's properly passed as a boolean string
      searchParams.set('isActive', isActiveParam === 'true' ? 'true' : 'false');
    }
    
    const apiUrl = `${PAYMENT_SERVICE_URL}/api/v1/admin/payment-methods?${searchParams.toString()}`;
    console.log('Sending request to:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Error response from payment service:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      console.error('Error data:', errorData);
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to fetch payment methods',
          error: errorData,
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();
    console.log('Response data:', responseData);

    // Validate the response data structure
    if (!responseData || !responseData.items || !responseData.pagination) {
      console.error('Invalid response data structure:', responseData);
      return NextResponse.json(
        { 
          message: 'Invalid response data structure from payment service',
          error: responseData
        },
        { status: 500 }
      );
    }

    // Transform the response to match the expected format in the admin panel
    const transformedData = {
      items: responseData.items,
      pagination: {
        total: responseData.pagination.total,
        currentPage: responseData.pagination.currentPage,
        pageSize: responseData.pagination.pageSize,
        totalPages: responseData.pagination.totalPages
      }
    };
    
    return NextResponse.json(transformedData);
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAdminToken();

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const url = `${PAYMENT_SERVICE_URL}/api/v1/payments/methods`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to create payment method',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
} 