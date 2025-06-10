import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL, PRODUCT_API_URL } from '@/lib/constants';

/**
 * GET handler for /api/categories/featured
 * Proxies requests to the API gateway
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10';
    
    
    console.log('Making API request to:', `${PRODUCT_API_URL}/categories/featured`);
    
    // Forward request to API gateway
    const response = await axios.get(`${PRODUCT_API_URL}/categories/featured`, {
      params: {
        limit,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching featured categories:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { error: 'Failed to fetch featured categories', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 