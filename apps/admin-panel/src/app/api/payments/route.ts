import { NextResponse } from 'next/server';
import { getAdminToken } from '@/lib/auth-utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

// Payment service URL with fallback to localhost
const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:3007';

// Track last request time to avoid rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

export async function GET(request: Request) {
  try {
    // Implement rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (lastRequestTime > 0 && timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      console.log(`Rate limiting: Waiting ${MIN_REQUEST_INTERVAL - timeSinceLastRequest}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    
    // Update last request time
    lastRequestTime = Date.now();
    
    const token = await getAdminToken();
    console.log('Admin token retrieved:', token ? 'Token exists' : 'No token');

    if (!token) {
      console.error('No admin token found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Process array parameters like status and provider
    const processedParams = new URLSearchParams();
    
    // Use Array.from to convert URLSearchParams entries to an array for iteration
    Array.from(searchParams.entries()).forEach(([key, value]) => {
      // Handle comma-separated values for array parameters
      if (key === 'status' || key === 'provider') {
        if (value.includes(',')) {
          // If it's already comma-separated, keep it as is
          processedParams.append(key, value);
        } else if (searchParams.getAll(key).length > 1) {
          // If there are multiple entries with the same key, join them with commas
          processedParams.append(key, searchParams.getAll(key).join(','));
        } else {
          // Otherwise, just add it as is
          processedParams.append(key, value);
        }
      } else {
        // For non-array parameters, just copy them
        processedParams.append(key, value);
      }
    });
    
    // Log the query parameters for debugging
    console.log('Payment API - Original query parameters:', Object.fromEntries(searchParams.entries()));
    console.log('Payment API - Processed query parameters:', Object.fromEntries(processedParams.entries()));
    
    // Ensure the URL is properly formatted
    const apiUrl = `${PAYMENT_SERVICE_URL}/api/v1/admin/payments?${processedParams.toString()}`;
    console.log('Payment API - Sending request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    console.log('Payment API - Response status:', response.status);

    if (response.status === 429) {
      // Handle rate limiting
      const retryAfter = response.headers.get('retry-after') || '60';
      console.warn(`Rate limit exceeded. Server requested retry after ${retryAfter} seconds`);
      
      return NextResponse.json(
        {
          message: 'Rate limit exceeded',
          error: { retryAfter },
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter
          }
        },
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { rawError: errorText };
      }
      
      console.error('Payment API - Error response:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      
      // Handle specific error cases
      if (errorData?.message?.includes('invalid input value for enum')) {
        // Handle enum validation errors
        return NextResponse.json(
          {
            message: 'Invalid filter value provided',
            error: { 
              details: 'One or more filter values are not valid for this field',
              originalError: errorData.message
            },
          },
          { status: 400 },
        );
      }
      
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to fetch payments',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();
    console.log('Payment API - Response data structure:', {
      hasItems: !!responseData.items,
      hasPagination: !!responseData.pagination,
      itemsCount: responseData.items?.length || 0,
    });
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 