import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const itemId = body.get('itemId');
    const quantity = Number(body.get('quantity'));
    const cartId = body.get('cartId');

    if (!itemId || !quantity || quantity < 1 || !cartId) {
      return NextResponse.json({ 
        error: 'Invalid parameters. Required: itemId, quantity, cartId' 
      }, { status: 400 });
    }

    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value;
    const deviceId = req.cookies.get('device_id')?.value;

    if (!token && !deviceId) {
      return NextResponse.json({ 
        error: 'Authentication or device ID required' 
      }, { status: 400 });
    }

    // Call the cart service API directly
    const apiUrl = `http://127.0.0.1:3004/api/v1/cart/items/${itemId}?cartId=${cartId}`;
    
    console.log(`Making PUT request to: ${apiUrl}`);
    
    const response = await axios.put(
      apiUrl,
      { quantity },
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-device-id': deviceId || '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    // Use an absolute URL for redirect
    const url = new URL('/cart', req.url);
    return NextResponse.redirect(url, 303);
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update cart item', 
        message: error.message,
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
} 