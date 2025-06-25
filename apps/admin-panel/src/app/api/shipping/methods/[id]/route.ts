import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server-auth';

const SHIPPING_SERVICE_URL = process.env.NEXT_PUBLIC_SHIPPING_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3008';

interface RouteContext {
  params: {
    id: string;
  };
}

async function forwardRequest(req: NextRequest, context: RouteContext) {
  const authToken = await getAuthToken(req);
  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  // Await params for Next.js dynamic API route
  const { params } = await context;
  const id = params.id;
  const adminPath = `/api/v1/shipping/admin/shipping-methods/${id}`;
  const destinationUrl = `${SHIPPING_SERVICE_URL}${adminPath}`;

  try {
    const response = await fetch(destinationUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: req.method !== 'GET' ? req.body : null,
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error(`Error forwarding request to shipping service for ID ${id}:`, error);
    return new NextResponse(JSON.stringify({ message: 'Error forwarding request' }), { status: 500 });
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  return forwardRequest(req, context);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return forwardRequest(req, context);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return forwardRequest(req, context);
} 