import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = (process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003').replace('localhost', '127.0.0.1');

export async function POST(request: NextRequest) {
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
    
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { message: 'Invalid request. Expected an array of attribute IDs.' },
        { status: 400 }
      );
    }
    
    // Forward request to product service
    // Note: The product service might not have a bulk delete endpoint for attributes,
    // so we might need to delete them one by one
    const deletePromises = body.ids.map(async (id: string) => {
      const response = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/admin/attributes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to delete attribute with ID: ${id}`);
      }
      
      return id;
    });
    
    try {
      await Promise.all(deletePromises);
      return NextResponse.json({ 
        message: `Successfully deleted ${body.ids.length} attributes` 
      });
    } catch (error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : 'Failed to delete some attributes' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error bulk deleting attributes:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 