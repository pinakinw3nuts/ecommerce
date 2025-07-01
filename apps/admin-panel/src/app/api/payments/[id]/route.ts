import { NextRequest, NextResponse } from 'next/server';
import { getAdminToken } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3007';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const token = await getAdminToken();

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    
    const apiUrl = `${PAYMENT_SERVICE_URL}/api/v1/payments/${id}`;
    console.log('Sending request to:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to fetch payment',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const token = await getAdminToken();

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    const body = await request.json();
    
    const apiUrl = `${PAYMENT_SERVICE_URL}/api/v1/payments/${id}`;
    console.log('Sending PUT request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'PUT',
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
          message: errorData.message || 'Failed to update payment',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const token = await getAdminToken();

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    
    const apiUrl = `${PAYMENT_SERVICE_URL}/api/v1/payments/${id}`;
    console.log('Sending DELETE request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to delete payment',
          error: errorData,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    );
  }
} 