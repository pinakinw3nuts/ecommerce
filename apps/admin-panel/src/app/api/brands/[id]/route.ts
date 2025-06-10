import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

interface BackendBrand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

async function makeRequest(url: string, options: RequestInit = {}) {
  console.log('Making request to:', url);
  console.log('Request options:', {
    method: options.method,
    headers: options.headers,
    body: options.body ? options.body.toString().substring(0, 200) + '...' : undefined
  });
  
  try {
    // Clone and modify headers to ensure proper content type
    const headers = new Headers(options.headers as HeadersInit);
    
    // For PUT/POST requests, ensure content type is set correctly
    if ((options.method === 'PUT' || options.method === 'POST') && options.body) {
      // Remove any existing content-type header (case insensitive)
      headers.delete('content-type');
      headers.delete('Content-Type');
      
      // Add the content type with charset
      headers.append('Content-Type', 'application/json;charset=UTF-8');
      
      console.log('Set Content-Type header to:', headers.get('Content-Type'));
    }
    
    // Validate that we're not sending an empty body for PUT/POST
    if ((options.method === 'PUT' || options.method === 'POST') && 
        (!options.body || options.body.toString().trim() === '')) {
      console.error('Attempting to make PUT/POST request with empty body');
      throw new Error('Cannot make PUT/POST request with empty body');
    }
    
    // Create new options with modified headers
    const newOptions = {
      ...options,
      headers
    };
    
    console.log('Final request options:', {
      method: newOptions.method,
      headers: Array.from(headers).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, string>),
      bodyPreview: newOptions.body ? newOptions.body.toString().substring(0, 100) + '...' : 'none'
    });
    
    const response = await fetch(url, newOptions);
    console.log('Response status:', response.status);
    
    // Log headers for debugging
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('Response headers:', responseHeaders);
    
    return response;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Get ID from params
    const { id } = context.params;
    
    // Await cookies in Next.js App Router
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    console.log('Making request with token:', token.value);
    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/admin/brands/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
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

      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Brand not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to fetch brand',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const brand = await response.json() as BackendBrand;
    console.log('Backend response:', brand);
    return NextResponse.json(brand);

  } catch (error: any) {
    console.error('Error fetching brand:', error);
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

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    // With Next.js App Router, we need to await the params and cookies
    const { id } = context.params;
    
    // Cookies must be awaited in Next.js App Router
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Parse the request body 
    let brandData;
    try {
      // Read the JSON content with await
      const requestText = await request.text();
      console.log('Raw request body:', requestText);
      
      if (!requestText || requestText.trim() === '') {
        console.error('Empty request body received in Next.js API route');
        return NextResponse.json(
          { message: 'Request body cannot be empty', code: 'EMPTY_BODY' },
          { status: 400 }
        );
      }
      
      // Parse the JSON text
      brandData = JSON.parse(requestText);
      console.log('Updating brand with data:', brandData);
      
      if (!brandData || Object.keys(brandData).length === 0) {
        console.error('Empty parsed JSON object in Next.js API route');
        return NextResponse.json(
          { message: 'Request body cannot be empty', code: 'EMPTY_BODY' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { message: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // Log the exact request being sent to the backend
    console.log('Making backend request with URL:', `${PRODUCT_SERVICE_URL}/api/v1/admin/brands/${id}`);
    console.log('Request method:', 'PUT');
    
    // Try a more direct approach using fetch directly
    const requestBody = JSON.stringify(brandData);
    console.log('Request body (stringified):', requestBody);
    
    // Ensure the body is not empty
    if (!requestBody || requestBody === '{}') {
      return NextResponse.json(
        { message: 'Cannot send empty request body', code: 'EMPTY_BODY' },
        { status: 400 }
      );
    }
    
    // Make the request directly without using makeRequest helper
    const response = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/admin/brands/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json'
      },
      body: requestBody
    });
    
    console.log('Update response status:', response.status);
    
    // Try to read the response body regardless of status
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      responseData = { message: responseText || 'Unknown error' };
    }
    
    if (!response.ok) {
      console.error('Error response data:', responseData);
      return NextResponse.json(
        { 
          message: responseData.message || 'Failed to update brand',
          code: responseData.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    console.log('Updated brand:', responseData);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Error updating brand:', error);
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

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Get ID from params
    const { id } = context.params;
    
    // Await cookies in Next.js App Router
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/admin/brands/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
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

      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Brand not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to delete brand',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Brand deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting brand:', error);
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