import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

async function makeRequest(url: string, options: RequestInit = {}) {
  console.log('Making request to:', url);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    console.log('Response status:', response.status);
    return response;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

interface BackendTag {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status')?.split(',').filter(Boolean) || [];
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query string for backend
    const queryParams = new URLSearchParams({
      page: page.toString(),
      take: pageSize.toString(),
      sortBy,
      sortOrder,
    });

    // Add search parameter if it exists and is not empty
    if (search.trim()) {
      queryParams.append('search', search.trim());
      console.log('Adding search parameter:', search.trim());
    }

    // Add status filter if present
    if (status.length > 0) {
      const isActive = status.includes('active');
      queryParams.append('isActive', isActive.toString());
    }

    console.log('Making request with token:', token.value);
    console.log('Full request URL:', `${PRODUCT_SERVICE_URL}/api/v1/tags?${queryParams.toString()}`);
    
    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/tags?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      
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

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to fetch tags',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const tags = (await response.json()) as BackendTag[];
    console.log('Backend response:', tags);

    // Filter tags based on search term if present
    let filteredTags = [...tags];
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filteredTags = tags.filter(tag => 
        tag.name.toLowerCase().includes(searchTerm)
      );
    }

    // Transform the array response into the expected format with proper pagination
    const transformedData = {
      tags: filteredTags || [],
      pagination: {
        total: filteredTags.length,
        totalPages: Math.ceil(filteredTags.length / pageSize),
        currentPage: page,
        pageSize: pageSize,
        hasMore: page * pageSize < filteredTags.length,
        hasPrevious: page > 1,
      },
    };

    console.log('Transformed response:', transformedData);
    return NextResponse.json(transformedData);

  } catch (error: any) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
        details: error.cause ? {
          code: error.cause.code,
          syscall: error.cause.syscall,
          address: error.cause.address,
          port: error.cause.port
        } : undefined
      },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const tagData = await request.json();

    // Validate required fields
    if (!tagData.name) {
      return NextResponse.json(
        { message: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const response = await makeRequest(`${PRODUCT_SERVICE_URL}/api/v1/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
      body: JSON.stringify(tagData),
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

      throw new Error(errorData?.message || 'Failed to create tag');
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 