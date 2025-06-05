import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = (process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003').replace('localhost', '127.0.0.1');

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Forward request to product service with correct API path
    const response = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/attributes/${context.params.id}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || 'Failed to fetch attribute' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching attribute ${context.params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    
    // Log the request body for debugging
    console.log(`PUT /api/products/attributes/${context.params.id} - Request body:`, {
      ...body,
      isActive: body.isActive,
      isFilterable: body.isFilterable,
      isRequired: body.isRequired
    });
    
    // First get the current attribute data to ensure we have all required fields
    const getResponse = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/attributes/${context.params.id}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!getResponse.ok) {
      const error = await getResponse.json().catch(() => ({}));
      console.log(`Failed to get attribute:`, error);
      return NextResponse.json(
        { message: error.message || 'Failed to get attribute' },
        { status: getResponse.status }
      );
    }
    
    // Get the current attribute data
    const currentAttribute = await getResponse.json();
    console.log(`Current attribute data:`, currentAttribute);
    
    // Merge the current data with the updates
    const mergedData = {
      ...currentAttribute,
      ...body,
      // Try ALL possible field names for the isActive status
      isActive: body.isActive === undefined ? currentAttribute.isActive : Boolean(body.isActive),
      active: body.isActive === undefined ? currentAttribute.isActive : Boolean(body.isActive),
      status: body.isActive === undefined ? (currentAttribute.isActive ? 'active' : 'inactive') : (Boolean(body.isActive) ? 'active' : 'inactive'),
      is_active: body.isActive === undefined ? currentAttribute.isActive : Boolean(body.isActive),
      enabled: body.isActive === undefined ? currentAttribute.isActive : Boolean(body.isActive),
      disabled: body.isActive === undefined ? !currentAttribute.isActive : !Boolean(body.isActive),
      state: body.isActive === undefined ? (currentAttribute.isActive ? 'active' : 'inactive') : (Boolean(body.isActive) ? 'active' : 'inactive'),
      // Other boolean fields
      isFilterable: body.isFilterable === undefined ? currentAttribute.isFilterable : Boolean(body.isFilterable),
      isRequired: body.isRequired === undefined ? currentAttribute.isRequired : Boolean(body.isRequired)
    };
    
    console.log(`Merged data for update:`, mergedData);
    
    // Forward request to product service with correct API path for admin operations
    const fullUrl = `${PRODUCT_SERVICE_URL}/api/v1/admin/attributes/${context.params.id}`;
    console.log(`PUT ${fullUrl} - Sending payload:`, JSON.stringify(mergedData));
    
    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mergedData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log(`PUT ${fullUrl} - Error response:`, error);
      return NextResponse.json(
        { message: error.message || 'Failed to update attribute' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`PUT ${fullUrl} - Success response:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error updating attribute ${context.params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }
    
    // Forward request to product service with correct API path for admin operations
    const response = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/admin/attributes/${context.params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || 'Failed to delete attribute' },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting attribute ${context.params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 