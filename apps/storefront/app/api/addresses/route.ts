import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const SHIPPING_SERVICE_URL = process.env.NEXT_PUBLIC_SHIPPING_SERVICE_URL || 'http://localhost:3008/api/v1';

// Convert any localhost URLs to use explicit IPv4 instead of IPv6
function getIpv4Url(url: string): string {
  return url.replace('localhost', '127.0.0.1');
}

export async function GET(req: NextRequest) {
  try {
    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value;
    
    // Call the user service API through the API gateway
    const response = await axios.get(`${getIpv4Url(SHIPPING_SERVICE_URL)}/addresses`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value;
    
    // Parse the request body
    const body = await req.json();
    
    // Call the user service API through the API gateway
    const response = await axios.post(`${getIpv4Url(SHIPPING_SERVICE_URL)}/addresses`, body, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 