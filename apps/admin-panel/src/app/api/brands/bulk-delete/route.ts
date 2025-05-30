import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

async function makeRequest(url: string, options: RequestInit = {}) {
  console.log('Making request to:', url);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    console.log('Response status:', response.status);
    return response;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const { brandIds } = await request.json();

    if (!Array.isArray(brandIds)) {
      return NextResponse.json(
        { message: 'Invalid request body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    console.log('Making bulk delete request with token:', token.value);
    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/brands/bulk-delete`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
        body: JSON.stringify({ brandIds }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      
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
          message: errorData?.message || 'Failed to delete brands',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error deleting brands:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
        details: error.cause ? {
          code: error.cause.code,
          syscall: error.cause.syscall,
          address: error.cause.address,
          port: error.cause.port
        } : undefined
      },
      { status: error.status || 500 }
    );
  }
} 