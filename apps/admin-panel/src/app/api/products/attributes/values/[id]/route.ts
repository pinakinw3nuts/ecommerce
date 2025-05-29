import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = (process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003').replace('localhost', '127.0.0.1');

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    
    // Forward request to product service with correct API path for admin operations
    const response = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/admin/attributes/values/${params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || 'Failed to update attribute value' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error updating attribute value ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }
    
    // Forward request to product service with correct API path for admin operations
    const response = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/admin/attributes/values/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || 'Failed to delete attribute value' },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting attribute value ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 