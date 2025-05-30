import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { makeRequest } from '../../../lib/make-request';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

// GET /api/categories - List categories
export async function GET(request: NextRequest) {
  console.log('Categories API called at:', new Date().toISOString());
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      console.log('No admin token found');
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Forward query params
    const { searchParams } = new URL(request.url);
    
    console.log('Making request with token:', token.value);
    const requestUrl = `${PRODUCT_SERVICE_URL}/api/v1/categories?${searchParams.toString()}`;
    console.log('Full request URL:', requestUrl);
    
    const response = await makeRequest(
      requestUrl,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
        cache: 'no-store', // Prevent caching
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response from categories API:', errorData);
      
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
          message: errorData?.message || 'Failed to fetch categories',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Categories fetched successfully. Response format:', {
      isArray: Array.isArray(data),
      hasDataProperty: data && 'data' in data,
      hasCategoriesProperty: data && 'categories' in data,
      categoryCount: Array.isArray(data) ? data.length : 
                    (data?.data && Array.isArray(data.data)) ? data.data.length :
                    (data?.categories && Array.isArray(data.categories)) ? data.categories.length : 0,
      responseKeys: Object.keys(data)
    });
    
    // Return the exact response format from the product service
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error fetching categories:', error);
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

// POST /api/categories - Create a new category
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

    const data = await request.json();
    console.log('Creating category with data:', data);
    
    // Ensure parentId is properly formatted (null or string)
    const formattedData = {
      ...data,
      parentId: data.parentId === '' ? null : data.parentId
    };
    
    console.log('Formatted category data:', formattedData);
    
    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/admin/categories`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error creating category:', errorData);
      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to create category',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Category created successfully:', result);
    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

// PATCH /api/categories - Bulk update categories
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/admin/categories/bulk-update`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to update categories',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error updating categories:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 