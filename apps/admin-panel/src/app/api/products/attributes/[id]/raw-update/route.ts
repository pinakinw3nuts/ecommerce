import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = (process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003').replace('localhost', '127.0.0.1');

export async function POST(request: NextRequest, context: { params: { id: string } }) {
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
    console.log(`POST /api/products/attributes/${context.params.id}/raw-update - Request body:`, body);
    
    // Try to use a special raw update endpoint if available
    const rawUpdateUrl = `${PRODUCT_SERVICE_URL}/api/v1/admin/attributes/${context.params.id}/raw-update`;
    console.log(`Trying raw update endpoint: ${rawUpdateUrl}`);
    
    // Forward the request to the backend
    const response = await fetch(rawUpdateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log(`Raw update failed:`, error);
      return NextResponse.json(
        { message: error.message || 'Failed to update attribute' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Raw update successful:`, data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`Error with raw update for attribute ${context.params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 