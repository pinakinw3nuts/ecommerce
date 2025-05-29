import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = (process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003').replace('localhost', '127.0.0.1');

export async function POST(
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
    
    // Log the request body for debugging
    console.log(`POST /api/products/attributes/${params.id}/status - Request body:`, body);
    
    // Ensure the isActive value is a boolean
    const isActive = Boolean(body.isActive);
    console.log(`Setting attribute ${params.id} status to: ${isActive}`);
    
    // Use the dedicated status endpoint
    const statusUrl = `${PRODUCT_SERVICE_URL}/api/v1/admin/attributes/${params.id}/status`;
    console.log(`Using dedicated status endpoint: ${statusUrl}`);
    
    // Make sure to explicitly send a boolean value
    const response = await fetch(statusUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        isActive: isActive,
        // Include alternative field names to ensure compatibility
        active: isActive,
        status: isActive ? 'active' : 'inactive'
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log(`Status update failed:`, error);
      return NextResponse.json(
        { message: error.message || 'Failed to update attribute status' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Status update successful:`, data);
    
    // Verify if the status was actually updated
    if (data.isActive !== isActive) {
      console.log(`Warning: Status was not updated as expected. Sent isActive=${isActive} but received isActive=${data.isActive}`);
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`Error updating attribute status ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 