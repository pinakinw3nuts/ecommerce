import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const WISHLIST_API_URL = process.env.NEXT_PUBLIC_WISHLIST_SERVICE_URL || 'http://127.0.0.1:3013/api/v1';

function getIpv4Url(url: string): string {
  return url.replace('localhost', '127.0.0.1');
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;

    const response = await axios.get(
      `${getIpv4Url(WISHLIST_API_URL)}/wishlist/count`,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error('Error getting wishlist count:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to get wishlist count', 
        message: err.response?.data?.message || err.message 
      }, 
      { status: err.response?.status || 500 }
    );
  }
} 