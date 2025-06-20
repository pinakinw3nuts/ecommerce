import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { SHIPPING_API_URL } from '@/lib/constants';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the address ID from the route params
    const addressId = params.id;
    
    // Get authorization header to pass through
    const authHeader = request.headers.get('Authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Always use IPv4 address
    let apiUrl = `${SHIPPING_API_URL}/addresses/${addressId}/default`.replace('localhost', '127.0.0.1');
    
    // Forward request to shipping service
    const response = await axios({
      method: 'PATCH',
      url: apiUrl,
      headers,
      data: {}
    });
    
    // Return the response from the shipping service
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Error setting default address:`, error.message);
    
    // Return appropriate error response
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Internal server error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 