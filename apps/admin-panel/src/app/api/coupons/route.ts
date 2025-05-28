import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

async function makeRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

interface BackendCoupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  startDate: string;
  endDate: string;
  isActive: boolean;
  minimumPurchaseAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  isFirstPurchaseOnly: boolean;
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
    const type = searchParams.get('type')?.split(',').filter(Boolean) || [];
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const valueMin = searchParams.get('valueMin') || '';
    const valueMax = searchParams.get('valueMax') || '';
    const skip = parseInt(searchParams.get('skip') || ((page - 1) * pageSize).toString(), 10);
    const take = parseInt(searchParams.get('take') || pageSize.toString(), 10);

    // Build query string for backend
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      take: take.toString(),
      sortBy,
      sortOrder,
    });

    // Add search parameter if it exists and is not empty
    if (search.trim()) {
      queryParams.append('search', search.trim());
    }

    // Add status filter if present
    if (status.length > 0) {
      const isActive = status.includes('active');
      queryParams.append('isActive', isActive.toString());
    }

    // Add type filter if present
    if (type.length > 0) {
      const discountType = type.includes('percent') ? 'PERCENTAGE' : 'FIXED';
      queryParams.append('discountType', discountType);
    }

    // Add date range filters if present
    if (dateFrom) {
      queryParams.append('dateFrom', dateFrom);
    }
    if (dateTo) {
      queryParams.append('dateTo', dateTo);
    }

    // Add value range filters if present
    if (valueMin) {
      queryParams.append('valueMin', valueMin);
    }
    if (valueMax) {
      queryParams.append('valueMax', valueMax);
    }
    
    const response = await makeRequest(
      `${PRODUCT_SERVICE_URL}/api/v1/coupons?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
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
          message: errorData?.message || 'Failed to fetch coupons',
          code: errorData?.code || 'API_ERROR',
          coupons: [],
          pagination: {
            total: 0,
            totalPages: 0,
            currentPage: page,
            pageSize: pageSize,
            hasMore: false,
            hasPrevious: false,
          }
        },
        { status: response.status }
      );
    }

    // Parse the response - could be an array or an object
    const responseData = await response.json();
    
    // Handle case where backend returns an array directly
    const coupons = Array.isArray(responseData) ? responseData : 
                    (responseData.coupons && Array.isArray(responseData.coupons)) ? 
                    responseData.coupons : [];

    // Filter coupons based on search term if present
    let filteredCoupons = [...coupons];
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filteredCoupons = coupons.filter((coupon: BackendCoupon) => 
        coupon.code.toLowerCase().includes(searchTerm) ||
        coupon.name.toLowerCase().includes(searchTerm) ||
        (coupon.description && coupon.description.toLowerCase().includes(searchTerm))
      );
    }

    // Transform the array response into the expected format with proper pagination
    const transformedData = {
      coupons: filteredCoupons || [],
      pagination: {
        total: filteredCoupons.length,
        totalPages: Math.ceil(filteredCoupons.length / pageSize),
        currentPage: page,
        pageSize: pageSize,
        hasMore: page * pageSize < filteredCoupons.length,
        hasPrevious: page > 1,
      },
    };

    return NextResponse.json(transformedData);

  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
        coupons: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 10,
          hasMore: false,
          hasPrevious: false,
        }
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

    const couponData = await request.json();

    // Validate required fields
    if (!couponData.code || !couponData.name || !couponData.discountAmount || !couponData.discountType || !couponData.startDate || !couponData.endDate) {
      return NextResponse.json(
        { message: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const response = await makeRequest(`${PRODUCT_SERVICE_URL}/api/v1/admin/coupons`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
      body: JSON.stringify(couponData),
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

      throw new Error(errorData?.message || 'Failed to create coupon');
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 