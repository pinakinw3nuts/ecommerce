import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

/**
 * GET handler for /api/categories/featured
 * Proxies requests to the API gateway
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10';
    
    // Use explicit IPv4 address for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3000'
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
        
    console.log('Making API request to:', `${baseUrl}/v1/categories/featured`);
    
    // Forward request to API gateway
    const response = await axios.get(`${baseUrl}/v1/categories/featured`, {
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