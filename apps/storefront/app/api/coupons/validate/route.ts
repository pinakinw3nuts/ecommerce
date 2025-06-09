import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

// POST handler - for validating coupon codes
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    
    if (!body || !body.code) {
      return NextResponse.json({ 
        valid: false,
        error: 'Coupon code is required'
      }, { status: 400 });
    }
    
    // Create a proper validation body with all required fields
    const validationBody = {
      code: body.code,
      userId: body.userId || 'guest-user',
      totalAmount: body.orderTotal || body.totalAmount || 100,
      productIds: body.productIds || []
    };
    
    console.log('Formatted validation request body:', validationBody);
    
    // Use explicit IPv4 address for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3000'
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
    
    // Try multiple endpoints to find the working one
    let response;
    let endpointUsed;
    
    try {
      console.log('Validating coupon with API (first attempt):', `${baseUrl}/v1/coupons/validate`);
      response = await axios.post(`${baseUrl}/v1/coupons/validate`, validationBody, {
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
        response = await axios.post(`${baseUrl}/api/v1/coupons/validate`, validationBody, {
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
        response = await axios.post(`${baseUrl}/api/v1/products/coupons/validate`, validationBody, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        });
        endpointUsed = '/api/v1/products/coupons/validate';
      }
    }
    
    console.log(`Coupon validation successful using ${endpointUsed}`);
    
    // Return the response data directly
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    
    // Return error response
    return NextResponse.json({ 
      valid: false,
      error: 'Failed to validate coupon',
      message: error.message || 'Unknown error'
    }, { status: error.response?.status || 500 });
  }
} 