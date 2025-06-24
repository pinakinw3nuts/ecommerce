import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { makeRequest } from '../../../../lib/make-request';
import { OrderStatus } from '@/types/orders';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Use IPv4 explicitly to avoid IPv6 issues
const ORDERS_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3006';

interface BulkUpdateBody {
  orderIds: string[];
  updates: {
    status?: OrderStatus;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('Bulk updating orders');
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const body: BulkUpdateBody = await request.json();
    
    if (!body.orderIds || !Array.isArray(body.orderIds) || body.orderIds.length === 0) {
      return NextResponse.json(
        { message: 'Order IDs are required and must be a non-empty array', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (!body.updates || (body.updates && !body.updates.status)) {
      return NextResponse.json(
        { message: 'Updates with status field is required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const url = `${ORDERS_SERVICE_URL}/api/v1/orders/bulk-update`;
    console.log('Full request URL:', url);
    
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle token expiration
      if (response.status === 401 && (
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('invalid token')
      )) {
        return NextResponse.json(
          { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to bulk update orders',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error bulk updating orders:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
} 