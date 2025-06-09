import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

export async function POST(req: NextRequest) {
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
    
    // Parse the request body
    const body = await req.json();
    
    if (!body.addressId || !body.shippingId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Call the checkout service API through the API gateway
    const response = await axios.post(`${API_GATEWAY_URL}/v1/checkout/preview`, body, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error generating checkout preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate checkout preview', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 