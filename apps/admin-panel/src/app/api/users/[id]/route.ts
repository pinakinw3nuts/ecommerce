import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import http from 'http';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://127.0.0.1:3002';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  [key: string]: string; // Allow string indexing for sorting
}

interface HttpResponse {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
}

// Helper function to make HTTP requests
function makeRequest(url: string, options: { method?: string; headers?: any; body?: any } = {}): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: `${urlObj.pathname}${urlObj.search}`,
      method: options.method || 'GET',
      headers: options.headers || {},
      family: 4, // Force IPv4
      lookup: (hostname: string, options: any, callback: (err: Error | null, address: string, family: number) => void) => {
        // Always return IPv4 address
        callback(null, '127.0.0.1', 4);
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({
              ok: true,
              status: res.statusCode,
              json: () => Promise.resolve(data ? JSON.parse(data) : null)
            });
          } catch (e) {
            resolve({
              ok: true,
              status: res.statusCode,
              json: () => Promise.resolve(null)
            });
          }
        } else {
          try {
            resolve({
              ok: false,
              status: res.statusCode || 500,
              json: () => Promise.resolve(data ? JSON.parse(data) : null)
            });
          } catch (e) {
            resolve({
              ok: false,
              status: res.statusCode || 500,
              json: () => Promise.resolve(null)
            });
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Mock users data (same as in the main users route)
const mockUsers = Array.from({ length: 100 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i === 0 ? 'admin' : i < 5 ? 'moderator' : 'user',
  status: i % 10 === 0 ? 'banned' : 'active',
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
}));

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const response = await makeRequest(`${USER_SERVICE_URL}/api/v1/users/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle token expiration
      if (response.status === 401 && (
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('invalid token')
      )) {
        return NextResponse.json(
          { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      throw new Error(errorData?.message || 'Failed to fetch user');
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const userData = await request.json();

    const response = await makeRequest(`${USER_SERVICE_URL}/api/v1/users/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      body: userData
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle token expiration
      if (response.status === 401 && (
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('invalid token')
      )) {
        return NextResponse.json(
          { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      throw new Error(errorData?.message || 'Failed to update user');
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const response = await makeRequest(`${USER_SERVICE_URL}/api/v1/users/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle token expiration
      if (response.status === 401 && (
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('invalid token')
      )) {
        return NextResponse.json(
          { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      throw new Error(errorData?.message || 'Failed to delete user');
    }

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 