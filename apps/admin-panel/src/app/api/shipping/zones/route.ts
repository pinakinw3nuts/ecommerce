import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const SHIPPING_SERVICE_URL = process.env.NEXT_PUBLIC_SHIPPING_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3008';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { search } = new URL(request.url);
    const url = `${SHIPPING_SERVICE_URL}/api/v1/shipping/admin/shipping-zones${search}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to fetch shipping zones',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();
    
    // Transform the response to match the expected format in the admin panel
    const transformedData = {
      zones: responseData.data,
      pagination: {
        total: responseData.total,
        page: responseData.page,
        pageSize: responseData.pageSize
      }
    };
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
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
    const url = `${SHIPPING_SERVICE_URL}/api/v1/shipping/admin/shipping-zones`;

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
          message: errorData.message || 'Failed to create shipping zone',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating shipping zone:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
} 