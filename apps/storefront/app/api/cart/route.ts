import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://127.0.0.1:3004/api/v1';

// Get cart or create if it doesn't exist
export async function GET(req: NextRequest) {
  try {
    // Get authentication details
    const token = req.cookies.get('accessToken')?.value;
    const deviceId = req.cookies.get('device_id')?.value || req.headers.get('x-device-id');
    
    console.log(`Cart API: deviceId=${deviceId}, token=${token ? 'present' : 'not present'}`);
    
    if (!token && !deviceId) {
      console.log('Cart API: No authentication or device ID found');
      return NextResponse.json(
        { error: 'Authentication or device ID required' },
        { status: 400 }
      );
    }
    
    try {
      // Get cartId and refresh params from query params
      const url = new URL(req.url);
      const cartId = url.searchParams.get('cartId');
      const refresh = url.searchParams.get('refresh') || 'false';
      
      // Build the API URL with the cartId and refresh params if provided
      let apiUrl = `${CART_SERVICE_URL}/cart`;
      const params = new URLSearchParams();
      if (cartId) {
        params.append('cartId', cartId);
      }
      params.append('refresh', refresh);
      
      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }
      
      console.log(`Making request to: ${apiUrl} with deviceId: ${deviceId}`);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-device-id': deviceId || '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      // Return the cart if successful
      console.log('Cart data received:', response.data);
      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      
      if (error.response?.status === 404) {
        // Cart not found, return empty cart structure
        return NextResponse.json({
          id: null,
          userId: null,
          total: 0,
          itemCount: 0,
          items: [],
          isCheckedOut: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: null
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch cart', 
          message: error.response?.data?.message || error.message 
        },
        { status: error.response?.status || 500 }
      );
    }
  } catch (outerError: any) {
    console.error('Unexpected error in cart API:', outerError);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: outerError.message
      },
      { status: 500 }
    );
  }
}

// POST endpoint to initialize a cart (for compatibility)
export async function POST(req: NextRequest) {
  try {
    // Get user information
    const token = req.cookies.get('accessToken')?.value;
    const deviceId = req.cookies.get('device_id')?.value || req.headers.get('x-device-id');
    
    console.log(`POST Cart API: deviceId=${deviceId}, token=${token ? 'present' : 'not present'}`);
    
    if (!token && !deviceId) {
      return NextResponse.json(
        { error: 'Authentication or device ID required' },
        { status: 400 }
      );
    }
    
    // Use the hotfix route to create an empty cart
    try {
      console.log('Using cart/create-empty to create a cart with empty items array');
      
      const apiUrl = 'http://127.0.0.1:3004/api/v1/cart/create-empty';
      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-device-id': deviceId || '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Cart created successfully via API', response.data);
      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error('Error creating cart through API:', error.message);
      console.log('Error details:', error.response?.data);
      
      // Fallback to the regular GET endpoint if the create-empty endpoint fails
      try {
        console.log('Falling back to GET /cart endpoint');
        
        const getCartUrl = 'http://127.0.0.1:3004/api/v1/cart';
        const getResponse = await axios.get(getCartUrl, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'x-device-id': deviceId || '',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        console.log('Cart retrieved successfully via GET', getResponse.data);
        return NextResponse.json(getResponse.data);
      } catch (getError: any) {
        console.error('Error getting cart through API:', getError.message);
        return NextResponse.json(
          { 
            error: 'Failed to create or fetch cart', 
            message: getError.message 
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error in POST cart endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create cart', 
        message: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear a cart
export async function DELETE(req: NextRequest) {
  try {
    // Get user information
    const token = req.cookies.get('accessToken')?.value;
    const deviceId = req.cookies.get('device_id')?.value || req.headers.get('x-device-id');
    
    console.log(`DELETE Cart API: deviceId=${deviceId}, token=${token ? 'present' : 'not present'}`);
    
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
    
    try {
      // Clear the cart through the API
      const apiUrl = `${CART_SERVICE_URL}/cart?cartId=${cartId}`;
      
      console.log(`Making DELETE request to: ${apiUrl}`);
      
      const response = await axios.delete(apiUrl, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-device-id': deviceId || '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error('Error clearing cart:', error.message);
      return NextResponse.json(
        { 
          error: 'Failed to clear cart', 
          message: error.message,
          details: error.response?.data || null
        },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in DELETE cart endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear cart',
        message: error.message
      },
      { status: 500 }
    );
  }
} 