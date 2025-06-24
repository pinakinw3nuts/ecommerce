import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Define the order service URL
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';

// Handle all HTTP methods
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'PUT');
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'PATCH');
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'DELETE');
}

/**
 * Generic handler for all HTTP methods
 */
async function handleRequest(request: NextRequest, path: string[], method: string): Promise<NextResponse> {
  try {
    // Reconstruct the path
    const endpointPath = path.join('/');
    
    // Forward the search params
    const url = new URL(request.url);
    const queryString = url.search;
    
    // Get the request body for non-GET requests
    let body: BodyInit | null = null;
    if (method !== 'GET') {
      const contentType = request.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        body = JSON.stringify(await request.json());
      } else {
        body = await request.text();
      }
    }

    // Extract headers from the request, excluding host and connection headers
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.append(key, value);
      }
    });

    // Add authorization header from cookies if available
    const sessionToken = request.cookies.get('sessionToken')?.value;
    if (sessionToken) {
      headers.set('Authorization', `Bearer ${sessionToken}`);
    }

    // Forward the request to the order service
    const response = await fetch(`${ORDER_SERVICE_URL}/${endpointPath}${queryString}`, {
      method,
      headers,
      body,
    });

    // Get response data
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Create a new response with the appropriate headers
    const newResponse = NextResponse.json(responseData, {
      status: response.status,
    });

    // Copy headers from the order service response
    response.headers.forEach((value, key) => {
      if (!['content-length', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
        newResponse.headers.set(key, value);
      }
    });

    return newResponse;
  } catch (error) {
    console.error('Error forwarding request to order service:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with order service' },
      { status: 500 }
    );
  }
} 