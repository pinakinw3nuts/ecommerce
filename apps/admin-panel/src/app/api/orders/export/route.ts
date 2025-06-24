import { NextRequest, NextResponse } from 'next/server';
import { makeRequest } from '../../../../lib/make-request';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Use IPv4 explicitly to avoid IPv6 issues
const ORDERS_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3006';

export async function GET(request: NextRequest) {
  try {
    console.log('Exporting orders to CSV');
    // Get token from request headers (set by middleware)
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Forward query params
    const { searchParams } = new URL(request.url);
    
    const url = `${ORDERS_SERVICE_URL}/api/v1/orders/export?${searchParams.toString()}`;
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

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to export orders',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    // Get the CSV data as a blob
    const csvData = await response.blob();
    
    // Return the CSV data with appropriate headers
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    console.error('Error exporting orders:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
} 