import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { SHIPPING_API_URL } from '@/lib/constants';

// Helper function to forward requests to shipping service
const forwardToShippingService = async (
  request: NextRequest,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
) => {
  try {
    // Get path from URL (stripping /api/shipping)
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/api/shipping');
    const subPath = pathParts.length > 1 ? pathParts[1] : '';
    
    // Get authorization header to pass through
    const authHeader = request.headers.get('Authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Always use IPv4 address
    let apiUrl = `${SHIPPING_API_URL}${subPath}${url.search}`.replace('localhost', '127.0.0.1');
    
    // Get request body if not GET
    let body = null;
    if (method !== 'GET' && request.body) {
      body = await request.json().catch(() => null);
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
  return forwardToShippingService(request, 'GET');
}

export async function POST(request: NextRequest) {
  return forwardToShippingService(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return forwardToShippingService(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return forwardToShippingService(request, 'DELETE');
}

export async function PATCH(request: NextRequest) {
  return forwardToShippingService(request, 'PATCH');
} 