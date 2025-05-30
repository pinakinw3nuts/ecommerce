import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import http from 'http';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



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

const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://127.0.0.1:3002';

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

export async function GET(request: NextRequest) {
  try {
    // Get the admin token
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toUpperCase();

    console.log('Received request with params:', {
      page,
      pageSize,
      search,
      role,
      status,
      sortBy,
      sortOrder
    });

    // Build query string for user service
    const queryString = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortOrder,
      ...(search && { search }),
      ...(role && role !== 'all' && { role }),
      ...(status && status !== 'all' && { status })
    }).toString();

    const apiUrl = new URL(`/api/v1/users?${queryString}`, USER_SERVICE_URL).toString();
    console.log('Calling user service:', apiUrl);

    const response = await makeRequest(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle token expiration specifically
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

      // Handle other errors
      throw new Error(errorData?.message || 'Failed to fetch users');
    }

    const data = await response.json();
    console.log('User service response:', {
      itemsCount: data.items?.length,
      total: data.total,
      page: data.page,
      totalPages: data.totalPages
    });

    // Transform the response to match the expected format
    const transformedData = {
      users: (data.items || []).map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status?.toLowerCase() || 'pending',
        createdAt: user.createdAt || new Date().toISOString(),
      })),
      pagination: {
        total: data.total || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.page || page,
        pageSize: data.pageSize || pageSize,
        hasMore: (data.page || page) < (data.totalPages || 1),
        hasPrevious: (data.page || page) > 1
      }
    };

    console.log('Transformed response:', {
      usersCount: transformedData.users.length,
      pagination: transformedData.pagination
    });

    return NextResponse.json(transformedData);

  } catch (error: any) {
    console.error('Error in users API:', error);
    
    // Return a structured error response
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const { id, status } = await request.json();
    
    const response = await makeRequest(`${USER_SERVICE_URL}/api/v1/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      body: { status }
    });

    if (!response.ok) {
      const errorData = await response.json();
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

export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!userData.name || !userData.email) {
      return NextResponse.json(
        { message: 'Name and email are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const response = await makeRequest(`${USER_SERVICE_URL}/api/v1/users`, {
      method: 'POST',
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

      throw new Error(errorData?.message || 'Failed to create user');
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 