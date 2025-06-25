import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server-auth';

const SHIPPING_SERVICE_URL = process.env.NEXT_PUBLIC_SHIPPING_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3008';

interface RouteContext {
  params: {
    id: string;
  };
}

async function forwardRequest(req: NextRequest, context: RouteContext) {
  try {
    const authToken = await getAuthToken(req);
    if (!authToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { params } = context;
    const id = params.id;
    const adminPath = `/api/v1/shipping/admin/shipping-zones/${id}`;
    const destinationUrl = `${SHIPPING_SERVICE_URL}${adminPath}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };

    const response = await fetch(destinationUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? await req.text() : null,
    });

    let data;
    const contentType = response.headers.get('content-type');
    
    try {
      // Only try to parse JSON if the content-type is application/json
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error(`Non-JSON response from shipping service for ID ${id}:`, text);
        return NextResponse.json(
          { message: 'Invalid response from shipping service' },
          { status: 500 }
        );
      }
    } catch (parseError) {
      console.error(`Error parsing JSON from shipping service for ID ${id}:`, parseError);
      return NextResponse.json(
        { message: 'Invalid JSON response from shipping service' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error(`Error from shipping service for ID ${id}:`, data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error forwarding request to shipping service:`, error);
    return NextResponse.json(
      { message: 'Error communicating with shipping service' },
      { status: 500 }
    );
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