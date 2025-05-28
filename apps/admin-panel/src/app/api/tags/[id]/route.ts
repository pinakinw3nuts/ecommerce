import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const { id } = params;

    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/tags/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
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
        { message: errorData?.message || 'Failed to fetch tag', code: errorData?.code || 'API_ERROR' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error fetching tag:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const { id } = params;
    const tagData = await request.json();

    // Validate required fields
    if (!tagData.name) {
      return NextResponse.json(
        { message: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // If no slug is provided, generate one from the name
    // This allows the backend to handle uniqueness
    if (!tagData.slug && tagData.name) {
      // Generate a simple slug from the name (convert to lowercase, replace spaces with hyphens)
      tagData.slug = tagData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
    }

    // Log the tag data being sent to the backend
    console.log('Updating tag with data:', JSON.stringify(tagData, null, 2));

    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/admin/tags/${id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
        body: JSON.stringify(tagData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response from backend:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        endpoint: `${PRODUCT_SERVICE_URL}/api/v1/admin/tags/${id}`
      });
      
      // Handle token expiration
      if (response.status === 401) {
        console.error('Authentication error details:', {
          token: token.value ? `${token.value.substring(0, 10)}...` : 'No token',
          errorCode: errorData?.code,
          errorMessage: errorData?.message
        });
        
        if (
          errorData?.code === 'TOKEN_EXPIRED' ||
          errorData?.message?.toLowerCase().includes('expired') ||
          errorData?.message?.toLowerCase().includes('invalid token')
        ) {
          return NextResponse.json(
            { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
            { status: 401 }
          );
        }
        
        return NextResponse.json(
          { message: 'Unauthorized - Admin privileges required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { message: errorData?.message || 'Failed to update tag', code: errorData?.code || 'API_ERROR' },
        { status: response.status }
      );
    }

    // Get the updated data from the response
    const data = await response.json();
    
    // Ensure the returned data has the isActive field that was sent in the request
    // since the backend might not include it in the response
    const enhancedData = {
      ...data,
      isActive: tagData.isActive !== undefined ? tagData.isActive : data.isActive
    };
    
    console.log('Updated tag response:', enhancedData);
    return NextResponse.json(enhancedData);

  } catch (error: any) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const { id } = params;

    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/admin/tags/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
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
        { message: errorData?.message || 'Failed to delete tag', code: errorData?.code || 'API_ERROR' },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 