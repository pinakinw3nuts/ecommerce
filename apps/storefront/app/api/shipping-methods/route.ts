import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value;
    
    // Check if user is authenticated
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters for address and cart information
    const searchParams = req.nextUrl.searchParams;
    const addressId = searchParams.get('addressId');
    
    // Call the shipping service API through the API gateway
    const response = await axios.get(`${API_GATEWAY_URL}/v1/shipping/methods`, {
      params: {
        addressId
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching shipping methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping methods', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 