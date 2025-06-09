import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value;
    
    // Call the cart service API through the API gateway
    const response = await axios.get(`${API_GATEWAY_URL}/v1/cart/items`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching cart items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart items', message: error.message },
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
    
    // Validate required fields
    if (!body.productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Call the cart service API through the API gateway
    const response = await axios.post(`${API_GATEWAY_URL}/v1/cart/items`, body, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 