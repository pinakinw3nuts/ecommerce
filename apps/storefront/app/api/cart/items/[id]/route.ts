import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://127.0.0.1:3004/api/v1';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value;
    const deviceId = req.cookies.get('device_id')?.value || req.headers.get('x-device-id');
    
    if (!token && !deviceId) {
      return NextResponse.json(
        { error: 'Authentication or device ID required' },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Get the cart ID from query parameters
    const url = new URL(req.url);
    const cartId = url.searchParams.get('cartId');
    
    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID is required' }, { status: 400 });
    }
    
    // Extract the id directly from the URL path as a workaround
    const pathParts = url.pathname.split('/');
    const itemId = pathParts[pathParts.length - 1];
    
    // Call the cart service API directly to update the item
    const apiUrl = `${CART_SERVICE_URL}/cart/items/${itemId}?cartId=${cartId}`;
    
    console.log(`Making PUT request to: ${apiUrl} with data:`, body);
    
    // Update the item quantity
    await axios.put(apiUrl, body, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'x-device-id': deviceId || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // After updating the item, fetch the full cart to return
    console.log(`Fetching updated cart data for cartId: ${cartId}`);
    const cartResponse = await axios.get(`${CART_SERVICE_URL}/cart?cartId=${cartId}&refresh=false`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'x-device-id': deviceId || '',
        'Accept': 'application/json',
      },
    });
    
    return NextResponse.json(cartResponse.data);
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value;
    const deviceId = req.cookies.get('device_id')?.value || req.headers.get('x-device-id');
    
    if (!token && !deviceId) {
      return NextResponse.json(
        { error: 'Authentication or device ID required' },
        { status: 400 }
      );
    }
    
    // Get the cart ID from query parameters
    const url = new URL(req.url);
    const cartId = url.searchParams.get('cartId');
    
    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID is required' }, { status: 400 });
    }
    
    // Extract the id directly from the URL path as a workaround
    const pathParts = url.pathname.split('/');
    const itemId = pathParts[pathParts.length - 1];
    
    // Call the cart service API directly
    const apiUrl = `${CART_SERVICE_URL}/cart/items/${itemId}?cartId=${cartId}`;
    
    console.log(`Making DELETE request to: ${apiUrl}`);
    
    const response = await axios.delete(apiUrl, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'x-device-id': deviceId || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Check if the response has data
    if (response.data) {
      console.log('Delete item response from cart service:', response.data);
      return NextResponse.json(response.data);
    }
    
    // If no data in response, fetch the updated cart
    console.log('No data in delete response, fetching updated cart');
    const cartResponse = await axios.get(`${CART_SERVICE_URL}/cart?cartId=${cartId}&refresh=false`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'x-device-id': deviceId || '',
        'Accept': 'application/json',
      },
    });
    
    return NextResponse.json(cartResponse.data);
  } catch (error: any) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete cart item', 
        message: error.message,
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
} 