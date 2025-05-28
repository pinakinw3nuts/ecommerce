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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get the tag ID from route params
    const tagId = params.id;
    if (!tagId) {
      return NextResponse.json(
        { message: 'Tag ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/tags/${tagId}`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Tag not found', code: 'TAG_NOT_FOUND' },
          { status: 404 }
        );
      }
      
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
          message: errorData?.message || 'Failed to fetch tag',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const tag = await response.json();
    return NextResponse.json(tag);

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get the tag ID from route params
    const tagId = params.id;
    if (!tagId) {
      return NextResponse.json(
        { message: 'Tag ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const tagData = await request.json();

    // Validate required fields
    if (!tagData.name) {
      return NextResponse.json(
        { message: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/tags/${tagId}`,
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
      
      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Tag not found', code: 'TAG_NOT_FOUND' },
          { status: 404 }
        );
      }
      
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
          message: errorData?.message || 'Failed to update tag',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const updatedTag = await response.json();
    return NextResponse.json(updatedTag);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get the tag ID from route params
    const tagId = params.id;
    if (!tagId) {
      return NextResponse.json(
        { message: 'Tag ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/tags/${tagId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Tag not found', code: 'TAG_NOT_FOUND' },
          { status: 404 }
        );
      }
      
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
          message: errorData?.message || 'Failed to delete tag',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: 'Tag deleted successfully' },
      { status: 200 }
    );

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