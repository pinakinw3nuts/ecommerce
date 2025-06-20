import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { SHIPPING_API_URL } from '@/lib/constants';

// Helper function to forward requests to shipping service
const forwardToShippingService = async (
  request: NextRequest,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
) => {
  try {
    // Get authorization header to pass through
    const authHeader = request.headers.get('Authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Always use IPv4 address
    let apiUrl = `${SHIPPING_API_URL}${path}`.replace('localhost', '127.0.0.1');
    
    // Get request body if not GET
    let body = null;
    if (method !== 'GET') {
      body = await request.json();
    }
    
    // Forward request to shipping service
    const response = await axios({
      method,
      url: apiUrl,
      headers,
      data: body
    });
    
    // Return the response from the shipping service
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Error forwarding ${method} request to shipping service:`, error.message);
    
    // Return appropriate error response
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
};

export async function GET(request: NextRequest) {
  // Extract path params and query params if needed
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/api/shipping/addresses');
  const subPath = pathParts.length > 1 ? pathParts[1] : '';
  
  // Forward the request to the shipping service
  return forwardToShippingService(request, `/addresses${subPath}${url.search}`, 'GET');
}

export async function POST(request: NextRequest) {
  return forwardToShippingService(request, '/addresses', 'POST');
}

export async function PUT(request: NextRequest) {
  // Extract ID from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/api/shipping/addresses/');
  const id = pathParts.length > 1 ? pathParts[1] : '';
  
  if (!id) {
    return NextResponse.json(
      { error: 'Missing address ID' },
      { status: 400 }
    );
  }
  
  return forwardToShippingService(request, `/addresses/${id}`, 'PUT');
}

export async function DELETE(request: NextRequest) {
  // Extract ID from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/api/shipping/addresses/');
  const id = pathParts.length > 1 ? pathParts[1] : '';
  
  if (!id) {
    return NextResponse.json(
      { error: 'Missing address ID' },
      { status: 400 }
    );
  }
  
  return forwardToShippingService(request, `/addresses/${id}`, 'DELETE');
}

export async function PATCH(request: NextRequest) {
  // Extract ID from URL and path
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/api/shipping/addresses/');
  
  if (pathParts.length <= 1) {
    return NextResponse.json(
      { error: 'Invalid request path' },
      { status: 400 }
    );
  }
  
  const remainingPath = pathParts[1];
  return forwardToShippingService(request, `/addresses/${remainingPath}`, 'PATCH');
} 