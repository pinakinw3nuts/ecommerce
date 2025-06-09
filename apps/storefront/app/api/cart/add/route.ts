import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const productId = body.get('productId');
    const quantity = body.get('quantity') ? Number(body.get('quantity')) : 1;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value;
    
    // Call the cart service API through the API gateway
    await axios.post(`${API_GATEWAY_URL}/v1/cart/items`, 
      { productId, quantity }, 
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    // Get the referer or use the base URL as fallback
    const referer = req.headers.get('referer');
    
    // Use an absolute URL for redirect
    const url = referer ? new URL(referer) : new URL('/', req.url);
    return NextResponse.redirect(url, 303);
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 