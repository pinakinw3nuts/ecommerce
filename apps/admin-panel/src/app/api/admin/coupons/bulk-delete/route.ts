import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { makeRequest } from '@/lib/make-request';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const { couponIds } = await request.json();

    if (!couponIds || !Array.isArray(couponIds) || couponIds.length === 0) {
      return NextResponse.json(
        { message: 'No coupon IDs provided', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/admin/coupons/bulk-delete`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
        body: JSON.stringify({ couponIds }),
      }
    );

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
          message: errorData?.message || 'Failed to delete coupons',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting coupons:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 