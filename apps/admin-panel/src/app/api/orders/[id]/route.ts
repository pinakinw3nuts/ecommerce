import { NextRequest, NextResponse } from 'next/server';
import { makeRequest } from '../../../../lib/make-request';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Use IPv4 explicitly to avoid IPv6 issues
const ORDERS_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3006';

// GET /api/orders/[id] - Get a single order
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    console.log('Getting order with ID:', context.params.id);
    // Get token from request headers (set by middleware)
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const url = `${ORDERS_SERVICE_URL}/api/v1/orders/${context.params.id}`;
    console.log('Full request URL:', url);
    
    const response = await makeRequest(url, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'X-Admin-Role': 'admin' // Add explicit admin role header
      },
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
          message: errorData?.message || 'Failed to fetch order',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error getting order:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

// PUT /api/orders/[id] - Update an order (limited functionality)
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    console.log('Updating order with ID:', context.params.id);
    // Get token from request headers (set by middleware)
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const orderData = await request.json();
    console.log('Update data:', orderData);

    const url = `${ORDERS_SERVICE_URL}/api/v1/orders/${context.params.id}`;
    console.log('Full request URL:', url);
    
    const response = await makeRequest(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
        'X-Admin-Role': 'admin' // Add explicit admin role header
      },
      body: JSON.stringify(orderData),
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
          message: errorData?.message || 'Failed to update order',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete an order
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    console.log('Deleting order with ID:', context.params.id);
    // Get token from request headers (set by middleware)
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const url = `${ORDERS_SERVICE_URL}/api/v1/orders/${context.params.id}`;
    console.log('Full request URL:', url);
    
    const response = await makeRequest(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'X-Admin-Role': 'admin' // Add explicit admin role header
      },
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
          message: errorData?.message || 'Failed to delete order',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: 'Order deleted successfully' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 