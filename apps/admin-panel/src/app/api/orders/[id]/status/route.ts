import { NextRequest, NextResponse } from 'next/server';
import { makeRequest } from '../../../../../lib/make-request';
import { OrderStatus } from '@/types/orders';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Use IPv4 explicitly to avoid IPv6 issues
const ORDERS_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3006';

interface StatusUpdateBody {
  status: OrderStatus;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Updating order status for ID:', params.id);
    // Get token from request headers (set by middleware)
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const body: StatusUpdateBody = await request.json();
    
    if (!Object.values(OrderStatus).includes(body.status)) {
      return NextResponse.json(
        { message: 'Invalid status value', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Updated URL to use the main order endpoint
    const url = `${ORDERS_SERVICE_URL}/api/v1/orders/${params.id}`;
    console.log('Full request URL:', url);
    
    const response = await makeRequest(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
        'X-Admin-Role': 'admin' // Add explicit admin role header
      },
      body: JSON.stringify({ status: body.status }),
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

      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Order not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to update order status',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// Also expose the PATCH method for backward compatibility
export { PUT as PATCH }; 