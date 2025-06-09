import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

// GET handler - for getting all available coupons
export async function GET() {
  try {
    // Use explicit IPv4 address for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3000'
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
    
    // First try the API gateway debug endpoint to help with troubleshooting
    try {
      console.log('Checking API gateway endpoints:', `${baseUrl}/debug/endpoints`);
      await axios.get(`${baseUrl}/debug/endpoints`);
    } catch (debugError) {
      console.log('Debug endpoint not available, continuing...');
    }
    
    // Try the main endpoint first
    let response;
    let endpointUsed;
    
    try {
      console.log('Fetching coupons from API (first attempt):', `${baseUrl}/v1/coupons?isActive=true&includeExpired=false`);
      response = await axios.get(`${baseUrl}/v1/coupons`, {
        params: {
          isActive: true,
          includeExpired: false
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      });
      endpointUsed = '/v1/coupons';
    } catch (firstError: any) {
      console.log('First attempt failed, trying alternative endpoint:', firstError.message);
      
      // Try alternatives if the first one fails
      try {
        console.log('Fetching coupons from API (second attempt):', `${baseUrl}/api/v1/coupons?isActive=true&includeExpired=false`);
        response = await axios.get(`${baseUrl}/api/v1/coupons`, {
          params: {
            isActive: true,
            includeExpired: false
          },
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        });
        endpointUsed = '/api/v1/coupons';
      } catch (secondError: any) {
        console.log('Second attempt failed, trying final endpoint:', secondError.message);
        
        // Try using direct product service path as last resort
        console.log('Fetching coupons from API (final attempt):', `${baseUrl}/api/v1/products/coupons?isActive=true&includeExpired=false`);
        response = await axios.get(`${baseUrl}/api/v1/products/coupons`, {
          params: {
            isActive: true,
            includeExpired: false
          },
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        });
        endpointUsed = '/api/v1/products/coupons';
      }
    }

    if (!response || !response.data) {
      console.error('Failed to fetch coupons: Empty response');
      throw new Error('Failed to fetch coupons: Empty response');
    }

    const coupons = Array.isArray(response.data) ? response.data : [];
    console.log(`Coupons fetched successfully from ${endpointUsed}, count:`, coupons.length);
    
    return NextResponse.json({ coupons });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    
    // Return empty array instead of mock data
    return NextResponse.json({ 
      coupons: [],
      error: 'Failed to fetch coupons from API',
      message: error.message || 'Unknown error'
    }, { status: error.response?.status || 500 });
  }
}

// POST handler - for validating a coupon code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderTotal } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }
    
    console.log('Validating coupon:', code, 'for order total:', orderTotal);
    
    // In a real implementation, we would get the user ID from the session
    // For now, use a mock user ID
    const mockUserId = 'guest-user';
    
    // Use explicit IPv4 address for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3000'
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
    
    const requestData = {
      code,
      userId: mockUserId,
      totalAmount: orderTotal,
      productIds: [] // We're validating for the entire cart, not specific products
    };
    
    // Try multiple endpoints to find the working one
    let response;
    let endpointUsed;
    
    try {
      console.log('Validating coupon with API (first attempt):', `${baseUrl}/v1/coupons/validate`);
      response = await axios.post(`${baseUrl}/v1/coupons/validate`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      });
      endpointUsed = '/v1/coupons/validate';
    } catch (firstError: any) {
      console.log('First validation attempt failed, trying alternative endpoint:', firstError.message);
      
      // Try alternatives if the first one fails
      try {
        console.log('Validating coupon with API (second attempt):', `${baseUrl}/api/v1/coupons/validate`);
        response = await axios.post(`${baseUrl}/api/v1/coupons/validate`, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        });
        endpointUsed = '/api/v1/coupons/validate';
      } catch (secondError: any) {
        console.log('Second validation attempt failed, trying final endpoint:', secondError.message);
        
        // Try using direct product service path as last resort
        console.log('Validating coupon with API (final attempt):', `${baseUrl}/api/v1/products/coupons/validate`);
        response = await axios.post(`${baseUrl}/api/v1/products/coupons/validate`, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        });
        endpointUsed = '/api/v1/products/coupons/validate';
      }
    }
    
    console.log(`Coupon validation successful using ${endpointUsed}`);
    
    const data = response.data;
    
    if (!response || response.status >= 400) {
      console.error('Coupon validation failed:', data.message || response.statusText);
      return NextResponse.json(
        { error: data.message || 'Invalid coupon code' },
        { status: response.status }
      );
    }
    
    console.log('Coupon validation successful:', data);
    
    // Transform the response to match our expected format
    return NextResponse.json({
      valid: data.isValid,
      coupon: {
        code,
        type: data.coupon.discountType === 'PERCENTAGE' ? 'percentage' : 
              data.coupon.discountType === 'FIXED' ? 'fixed' : 'shipping',
        value: data.coupon.discountAmount,
        minOrderValue: data.coupon.minimumPurchaseAmount || 0,
        description: data.coupon.description || `${data.coupon.discountAmount}${data.coupon.discountType === 'PERCENTAGE' ? '%' : '$'} off your order`,
        discountAmount: data.discountAmount
      }
    });
    
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    
    // Return clear error message without fallback to mock data
    return NextResponse.json(
      { 
        error: 'Failed to validate coupon due to server error',
        message: error.message || 'Unknown error'
      },
      { status: error.response?.status || 500 }
    );
  }
} 