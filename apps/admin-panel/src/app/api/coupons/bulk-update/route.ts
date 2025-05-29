import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { makeRequest } from '@/lib/make-request';
import { PRODUCT_SERVICE_URL } from '@/lib/constants';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL_FIXED = PRODUCT_SERVICE_URL.replace('localhost', '127.0.0.1');

// Helper function to get a valid authorization header
const getValidAuthHeader = () => {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token');

  if (!token) {
    console.log('No token in cookies, using hardcoded token');
    return 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ODYwYmU1MS0wODNiLTQ5ZDAtODAyYy1lNDU3YjBmMmEwZDUiLCJlbWFpbCI6ImRlbW8zQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzQ4MzUwMzAxLCJleHAiOjE3NDgzNTEyMDEsImF1ZCI6InVzZXItc2VydmljZSIsImlzcyI6ImF1dGgtc2VydmljZSJ9.W3yYuXfyVQ0H-8r2tYG_7DtkWt0CYXR6oL_PGVqT3qs';
  }

  return `Bearer ${token.value}`;
};

async function makeLocalRequest(url: string, options: RequestInit = {}) {
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = getValidAuthHeader();

    if (!authHeader.includes('Bearer')) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { couponIds, updates } = body;

    if (!couponIds || !Array.isArray(couponIds) || couponIds.length === 0) {
      return NextResponse.json(
        { message: 'Coupon IDs are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { message: 'Updates object is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    try {
      // Process each coupon update sequentially
      const results = await Promise.all(
        couponIds.map(async (id) => {
          try {
            const response = await makeLocalRequest(
              `${PRODUCT_SERVICE_URL_FIXED}/api/v1/coupons/${id}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': authHeader,
                },
                body: JSON.stringify(updates),
              }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              return {
                id,
                success: false,
                error: errorData?.message || `Failed to update coupon with ID: ${id}`,
              };
            }

            return { id, success: true };
          } catch (error) {
            console.error(`Error updating coupon with ID ${id}:`, error);
            return {
              id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      // Check if any updates failed
      const failedUpdates = results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        return NextResponse.json(
          {
            message: 'Some coupon updates failed',
            code: 'PARTIAL_SUCCESS',
            results,
          },
          { status: 207 } // Multi-Status
        );
      }

      return NextResponse.json({
        message: 'All coupons updated successfully',
        results,
      });
    } catch (error) {
      console.error('Error processing bulk update:', error);
      
      return NextResponse.json(
        { 
          message: 'Failed to process bulk update',
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in bulk update API route:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 