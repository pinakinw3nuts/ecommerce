import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Test the connection to the product service
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products?limit=1`;
    console.log('Testing connection to product service:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          message: 'Connection test failed',
          status: response.status,
          statusText: response.statusText,
          error: errorData
        },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    
    // Log the structure of the response
    console.log('API Response keys:', Object.keys(data));
    console.log('Data property exists:', 'data' in data);
    console.log('Meta property exists:', 'meta' in data);
    
    if (data.data) {
      console.log('Data array length:', Array.isArray(data.data) ? data.data.length : 'Not an array');
      if (Array.isArray(data.data) && data.data.length > 0) {
        console.log('First product keys:', Object.keys(data.data[0]));
      }
    }
    
    if (data.meta) {
      console.log('Meta keys:', Object.keys(data.meta));
    }
    
    // Transform the response to match the expected format
    const transformedData = {
      products: Array.isArray(data.data) ? data.data : [],
      pagination: {
        total: data.meta?.total || 0,
        totalPages: data.meta?.totalPages || 0,
        currentPage: data.meta?.page || 1,
        pageSize: data.meta?.limit || 10,
        hasMore: data.meta?.hasNextPage || false,
        hasPrevious: data.meta?.hasPrevPage || false
      }
    };
    
    return NextResponse.json({
      success: true,
      originalResponse: data,
      transformedResponse: transformedData,
      connectionStatus: 'Connected successfully to product service'
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { 
        message: 'Test connection failed', 
        error: (error as Error).message,
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
} 