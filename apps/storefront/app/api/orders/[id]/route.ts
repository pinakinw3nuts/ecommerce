import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ORDER_API_URL, USE_MOCK_DATA } from '@/lib/constants';

// Import the mapping function from the parent route
import { mapOrderFromApi } from '../route';

// Force IPv4 by replacing localhost with 127.0.0.1 in the API URL
function getIpv4Url(url: string): string {
  return url.replace('localhost', '127.0.0.1');
}

// Helper function to ensure numeric values are valid
function ensureValidNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  // If it's already a number, return it
  if (typeof value === 'number') {
    return value;
  }
  
  // If it's a string that might have formatting issues
  if (typeof value === 'string') {
    // Remove all commas and ensure only one decimal point
    const cleaned = value.replace(/,/g, '').replace(/\.(?=.*\.)/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

// Mock order detail for fallback
const MOCK_ORDER_DETAIL = {
  id: '29a0b1c5-e89b-12d3-a456-426614174000',
  orderNumber: 'ORD-12345',
  userId: 'user123',
  status: 'delivered',
  paymentStatus: 'paid',
  paymentMethod: 'credit_card',
  trackingNumber: 'TRK123456789US',
  shippingCarrier: 'UPS',
  createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
  updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),  // 8 days ago
  items: [
    {
      productId: 'prod-123',
      name: 'Premium Brake Pads',
      quantity: 2,
      price: 89.99,
      image: '/images/products/brake-pads.jpg',
      sku: 'BP-PREMIUM-001',
      status: 'delivered'
    },
    {
      productId: 'prod-456',
      name: 'Oil Filter',
      quantity: 1,
      price: 12.99,
      image: '/images/products/oil-filter.jpg',
      sku: 'OF-STANDARD-002',
      status: 'delivered'
    }
  ],
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postalCode: '12345',
    country: 'United States',
    phone: '555-123-4567'
  },
  billingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postalCode: '12345',
    country: 'United States',
    phone: '555-123-4567'
  },
  subtotal: 192.97,
  shippingCost: 9.99,
  tax: 16.29,
  discount: 0,
  total: 219.25
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract and validate orderId first to avoid NextJS warnings
  const orderId = params.id;
  
  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    // Get token from cookies with fallbacks
    const token = req.cookies.get('accessToken')?.value || 
                 req.cookies.get('accessToken_client')?.value || 
                 req.cookies.get('auth_backup_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    try {
      // Try multiple endpoints in sequence since the public one is working for the list
      const baseUrl = getIpv4Url(ORDER_API_URL);
      
      // First try the public endpoint that's working for the order list
      const endpoints = [
        `${baseUrl}/public/orders/${orderId}`, // Try public endpoint first
        `${baseUrl}/orders/${orderId}`         // Then try private endpoint
      ];
      
      let response = null;
      let successEndpoint = '';
      let lastError = null;
      
      for (const apiUrl of endpoints) {
        try {
          // Log API call details for debugging
          console.log('Trying order service endpoint:', {
            url: apiUrl,
            token: token ? 'exists' : 'missing'
          });
          
          const result = await axios.get(apiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            timeout: 8000 // Set a timeout to avoid hanging
          });
          
          response = result;
          successEndpoint = apiUrl;
          console.log(`Successfully connected to endpoint: ${apiUrl}`);
          break;
        } catch (e: any) {
          lastError = e;
          console.log(`Endpoint ${apiUrl} failed: ${e.message}`);
        }
      }
      
      // If no endpoint succeeded, throw the last error
      if (!response) {
        throw lastError || new Error('All endpoints failed');
      }
      
      console.log('Order details API response:', {
        status: response.status,
        hasData: !!response.data
      });
      
      // Ensure we have a proper response
      if (response.data && response.data.id) {
        // Map the response to match our frontend expected format
        const order = mapOrderFromApi(response.data);
        
        return NextResponse.json(order);
      }
      
      throw new Error('Invalid response format from order service');
    } catch (apiError: any) {
      console.error('Error calling order service for details:', apiError);
      
      // If USE_MOCK_DATA flag is enabled or we get a 404 (service not available)
      if (USE_MOCK_DATA || apiError.response?.status === 404 || apiError.code === 'ECONNABORTED') {
        console.log('Using mock data for order details');
        
        // If an ID was passed, customize the mock data with it
        const mockOrder = {
          ...MOCK_ORDER_DETAIL,
          id: orderId,
          orderNumber: `ORD-${orderId.substring(0, 5).toUpperCase()}`,
        };
        
        // Return mock data
        return NextResponse.json(mockOrder);
      }
      
      // Otherwise propagate the error
      throw apiError;
    }
  } catch (error: any) {
    console.error('Error in order details API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch order details', 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          orderApiUrl: ORDER_API_URL,
          status: error.response?.status,
          orderID: orderId
        } : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract and validate orderId first to avoid NextJS warnings
  const orderId = params.id;
  
  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const token = req.cookies.get('accessToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Try multiple endpoints in sequence
    const baseUrl = getIpv4Url(ORDER_API_URL);
    const endpoints = [
      `${baseUrl}/public/orders/${orderId}`,
      `${baseUrl}/orders/${orderId}`
    ];
    
    let response = null;
    let lastError = null;
    
    for (const apiUrl of endpoints) {
      try {
        console.log(`Attempting to update order at: ${apiUrl}`);
        
        const result = await axios.put(
          apiUrl,
          body,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        
        response = result;
        console.log(`Successfully updated order at: ${apiUrl}`);
        break;
      } catch (e: any) {
        lastError = e;
        console.log(`Failed to update order at ${apiUrl}: ${e.message}`);
      }
    }
    
    if (!response) {
      throw lastError || new Error('Failed to update order at all endpoints');
    }
    
    // Map the response to match our frontend expected format
    const order = mapOrderFromApi(response.data);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract and validate orderId first to avoid NextJS warnings
  const orderId = params.id;
  
  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const token = req.cookies.get('accessToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { action, reason } = body;
    
    if (action === 'cancel') {
      // Try multiple endpoints in sequence
      const baseUrl = getIpv4Url(ORDER_API_URL);
      const endpoints = [
        `${baseUrl}/public/orders/${orderId}/cancel`,
        `${baseUrl}/orders/${orderId}/cancel`
      ];
      
      let response = null;
      let lastError = null;
      
      // Make sure we have a reason
      const cancellationReason = reason || 'No reason provided';
      
      console.log(`Attempting to cancel order ${orderId} with reason: ${cancellationReason}`);
      console.log(`Using token: ${token.substring(0, 10)}...`);
      
      for (const apiUrl of endpoints) {
        try {
          console.log(`Attempting to cancel order at: ${apiUrl}`);
          
          const result = await axios.post(
            apiUrl,
            { reason: cancellationReason }, // Include reason in the request body
            {
              headers: {
                'Authorization': `Bearer ${token}`, // Ensure 'Bearer ' prefix is included
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
            }
          );
          
          response = result;
          console.log(`Successfully cancelled order at: ${apiUrl}, status: ${result.status}`);
          break;
        } catch (e: any) {
          lastError = e;
          console.log(`Failed to cancel order at ${apiUrl}: ${e.message}`);
          console.log('Error details:', {
            status: e.response?.status,
            data: e.response?.data
          });
        }
      }
      
      if (!response) {
        throw lastError || new Error('Failed to cancel order at all endpoints');
      }
      
      // Map the response to match our frontend expected format
      const order = mapOrderFromApi(response.data);
      
      return NextResponse.json(order);
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error processing order action:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return NextResponse.json(
      { error: 'Failed to process order action', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}