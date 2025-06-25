import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const SHIPPING_SERVICE_URL = process.env.NEXT_PUBLIC_SHIPPING_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3008';


export async function GET(request: NextRequest) {
  console.log("hello test===================");
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
    
    // Special handling for isActive parameter to ensure it's passed correctly
    const isActiveParam = searchParams.get('isActive');
    if (isActiveParam !== null) {
      // Make sure it's properly passed as a boolean string
      searchParams.set('isActive', isActiveParam === 'true' ? 'true' : 'false');
    }
    
    // Handle rate range parameters
    const minRateParam = searchParams.get('minRate');
    const maxRateParam = searchParams.get('maxRate');
    
    console.log('Rate range params:', { minRate: minRateParam, maxRate: maxRateParam });
    
    const apiUrl = `${SHIPPING_SERVICE_URL}/api/v1/shipping/admin/shipping-method?${searchParams.toString()}`;
    console.log('Sending request to:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to fetch shipping methods',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();
    
    // Transform the response to match the expected format in the admin panel
    const transformedData = {
      methods: responseData.data,
      pagination: {
        total: responseData.total,
        page: responseData.page,
        pages: Math.ceil(responseData.total / responseData.pageSize),
        limit: responseData.pageSize
      }
    };
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const url = `${SHIPPING_SERVICE_URL}/api/v1/shipping/admin/shipping-methods`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to create shipping method',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating shipping method:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
} 