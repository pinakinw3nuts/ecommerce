import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

function getIpv4Url(url: string): string {
  return url.replace('localhost', '127.0.0.1');
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const WISHLIST_API_URL = process.env.NEXT_PUBLIC_WISHLIST_SERVICE_URL || 'http://127.0.0.1:3013/api/v1';
    const response = await axios.delete(
      `${getIpv4Url(WISHLIST_API_URL)}/wishlist`,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: { productId },
      }
    );

    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error('Error removing from wishlist:', err);
    return NextResponse.json({ error: 'Failed to remove from wishlist', message: err.message }, { status: err.response?.status || 500 });
  }
} 