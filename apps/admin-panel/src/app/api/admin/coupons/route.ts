import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { makeRequest } from '@/lib/make-request';
import { PRODUCT_SERVICE_URL, USER_SERVICE_URL } from '@/lib/constants';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
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
  console.log('Admin Coupons API called at:', new Date().toISOString());
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      console.log('No admin token found');
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
    const sortOrderInput = searchParams.get('sortOrder') || 'desc';
    // Normalize sort order to uppercase for the backend
    const sortOrder = sortOrderInput.toUpperCase();
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const valueMin = searchParams.get('minValue') || '';
    const valueMax = searchParams.get('maxValue') || '';
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
      queryParams.append('minValue', valueMin);
    }
    if (valueMax) {
      queryParams.append('maxValue', valueMax);
    }
    
    console.log('Making request with token:', token.value);
    const requestUrl = `${PRODUCT_SERVICE_URL}/api/v1/coupons?${queryParams.toString()}`;
    console.log('Full request URL:', requestUrl);
    
    const response = await makeRequest(
      requestUrl,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
        cache: 'no-store', // Prevent caching
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response from coupons API:', errorData);
      console.error('Response status:', response.status, response.statusText);
      
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
    
    console.log('Coupons fetched successfully. Response format:', {
      isArray: Array.isArray(responseData),
      hasDataProperty: responseData && 'data' in responseData,
      hasCouponsProperty: responseData && 'coupons' in responseData,
      couponCount: Array.isArray(responseData) ? responseData.length : 
                  (responseData?.data && Array.isArray(responseData.data)) ? responseData.data.length :
                  (responseData?.coupons && Array.isArray(responseData.coupons)) ? responseData.coupons.length : 0,
      responseKeys: Object.keys(responseData)
    });
    
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
    
    // Log network error details if available
    if (error instanceof TypeError && error.cause) {
      console.error('Network error details:', {
        code: (error.cause as any).code,
        syscall: (error.cause as any).syscall,
        address: (error.cause as any).address,
        port: (error.cause as any).port
      });
    }
    
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
        },
        details: error.cause ? {
          code: (error.cause as any).code,
          syscall: (error.cause as any).syscall,
          address: (error.cause as any).address,
          port: (error.cause as any).port
        } : undefined
      },
      { status: error.status || 500 }
    );
  }
}

// Function to refresh the token
async function refreshToken(refreshToken: string) {
  try {
    const response = await fetch(`${USER_SERVICE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/admin/coupons called');
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    const refreshTokenCookie = cookieStore.get('admin_refresh_token');

    if (!token) {
      console.log('No admin token found in cookies');
      // Check if token is in Authorization header instead
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const headerToken = authHeader.substring(7);
        console.log('Found token in Authorization header, length:', headerToken.length);
        
        // Create the coupon with the token from header
        return await createCouponWithToken(request, headerToken);
      }
      
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Log token information to help debug authorization issues
    console.log('Token found in cookies:', {
      name: token.name,
      length: token.value.length,
      prefix: token.value.substring(0, 20) + '...'
    });
    
    // Create the coupon with the token from cookie
    return await createCouponWithToken(request, token.value);
    
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

// Separate function to create coupon with a given token
async function createCouponWithToken(request: NextRequest, tokenValue: string) {
  try {
    let couponData;
    try {
      couponData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid JSON body', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!couponData.code || !couponData.name || !couponData.discountAmount || !couponData.discountType || !couponData.startDate || !couponData.endDate) {
      return NextResponse.json(
        { message: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    
    // Ensure date fields are in proper ISO format
    try {
      // Format dates to ISO strings
      if (couponData.startDate) {
        const startDate = new Date(couponData.startDate);
        if (isNaN(startDate.getTime())) throw new Error('Invalid startDate');
        couponData.startDate = startDate.toISOString();
      }
      
      if (couponData.endDate) {
        const endDate = new Date(couponData.endDate);
        if (isNaN(endDate.getTime())) throw new Error('Invalid endDate');
        couponData.endDate = endDate.toISOString();
      }
      
      // Ensure discountAmount is a number
      if (couponData.discountAmount) {
        couponData.discountAmount = Number(couponData.discountAmount);
        if (isNaN(couponData.discountAmount)) {
          throw new Error('discountAmount must be a valid number');
        }
      }
      
      // Convert string booleans to actual booleans if needed
      if (typeof couponData.isActive === 'string') {
        couponData.isActive = couponData.isActive === 'true';
      }
      
      if (typeof couponData.isFirstPurchaseOnly === 'string') {
        couponData.isFirstPurchaseOnly = couponData.isFirstPurchaseOnly === 'true';
      }
      
      // Ensure numeric fields are numbers
      if (couponData.minimumPurchaseAmount) {
        couponData.minimumPurchaseAmount = Number(couponData.minimumPurchaseAmount);
      }
      
      if (couponData.usageLimit) {
        couponData.usageLimit = Number(couponData.usageLimit);
      }
      
      if (couponData.perUserLimit) {
        couponData.perUserLimit = Number(couponData.perUserLimit);
      }
    } catch (error) {
      return NextResponse.json(
        { message: (error as Error).message || 'Invalid data format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    
    const requestUrl = `${PRODUCT_SERVICE_URL}/api/v1/admin/coupons`;
    console.log('Making request to:', requestUrl);
    console.log('Using token of length:', tokenValue.length);
    
    const response = await makeRequest(requestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenValue}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(couponData),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.log('Error response:', errorData);
      } catch (e) {
        errorData = { message: 'Failed to create coupon' };
      }
      
      // Handle token expiration
      if (response.status === 401 && (
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('invalid token')
      )) {
        console.log('Token expired');
        return NextResponse.json(
          { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      throw new Error(errorData?.message || `Failed to create coupon: ${response.status}`);
    }

    const data = await response.json();
    console.log('Coupon created successfully');
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error in createCouponWithToken:', error);
    throw error;
  }
} 