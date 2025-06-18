import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
// import { ORDER_API_URL } from '@/lib/constants';
import { Order } from '@/lib/types/order';

const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3006/api/v1';

// Convert any localhost URLs to use explicit IPv4 instead of IPv6
function getIpv4Url(url: string): string {
  return url.replace('localhost', '127.0.0.1');
}

// Ensure values are valid numbers
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

export async function GET(req: NextRequest) {
  try {
    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value ||
      req.cookies.get('accessToken_client')?.value ||
      req.cookies.get('auth_backup_token')?.value;

    // Check if user is authenticated
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for pagination and filtering
    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '10';
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    try {
      // Force IPv4 by replacing localhost with 127.0.0.1 in the API URL
      const apiUrl = getIpv4Url(ORDER_API_URL);
      let response = null;
      let successEndpoint = '';
      let lastError = null;

      // Try each endpoint until one succeeds
      const endpoint = `${apiUrl}/public/orders`;
      try {
        console.log(`Attempting to call endpoint: ${endpoint}`);

        // Call the order service API
        const result = await axios.get(endpoint, {
          params: {
            page,
            limit: pageSize,
            status,
            dateFrom,
            dateTo
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          // Set timeout to avoid long waiting times
          timeout: 5000
        });

        // If successful, store the response and break the loop
        response = result;
        successEndpoint = endpoint;

      } catch (e: any) {
        // Store last error and continue to next endpoint
        lastError = e;
        console.error(`Endpoint ${endpoint} failed:`, e.message);
      }
     
      // If no endpoint succeeded, throw the last error
      if (!response) {
        throw lastError || new Error('All endpoints failed');
      }

      console.log(`Successfully connected to endpoint: ${successEndpoint}`);
      console.log('Order API response:', {
        status: response.status,
        hasData: !!response.data,
        dataCount: response.data?.data?.length || 0
      });

      // Validate that we have a proper response with data
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Map the response to match our frontend expected format
        const orders = response.data.data.map((order: any) => mapOrderFromApi(order));

        return NextResponse.json({
          orders,
          pagination: {
            total: response.data.meta.total || orders.length,
            totalPages: response.data.meta.totalPages || 1,
            currentPage: Number(page),
            pageSize: Number(pageSize),
            hasMore: Number(page) < (response.data.meta.totalPages || 1),
            hasPrevious: Number(page) > 1
          }
        });
      }

      throw new Error('Invalid response format from order service');
    } catch (apiError: any) {
      console.error('Error calling order service:', apiError);     

      // Otherwise, propagate the error
      throw apiError;
    }
  } catch (error: any) {
    console.error('Error in orders API route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        message: error.message,
        // Add additional debug info for development
        details: process.env.NODE_ENV === 'development' ? {
          orderApiUrl: ORDER_API_URL,
          status: error.response?.status,
          data: error.response?.data
        } : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
}

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

    if (!body.shippingAddress || !body.items || !body.items.length) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Extract user ID from token or use from request if available
    let userId;
    try {
      // This assumes the token is a JWT and you can extract the user ID
      // You might need to adjust this based on your token structure
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      userId = tokenPayload.sub || tokenPayload.id;
    } catch (e) {
      console.error('Error extracting user ID from token:', e);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Prepare the order data for the order service
    const orderData = {
      userId,
      items: body.items,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress || body.shippingAddress
    };

    // Call the order service API through the API gateway
    const response = await axios.post(`${ORDER_API_URL}/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Map the response to match our frontend expected format
    const order = mapOrderFromApi(response.data);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * Map the API order response to the frontend Order type
 */
export function mapOrderFromApi(apiOrder: any): Order {
  return {
    id: apiOrder.id,
    orderNumber: apiOrder.orderNumber || `ORD-${apiOrder.id.substring(0, 8)}`,
    userId: apiOrder.userId || 'anonymous',
    status: apiOrder.status?.toLowerCase() || 'pending',
    paymentStatus: apiOrder.paymentStatus?.toLowerCase() || 'pending',
    paymentMethod: apiOrder.paymentMethod || 'Unknown',
    createdAt: apiOrder.createdAt,
    updatedAt: apiOrder.updatedAt,
    trackingNumber: apiOrder.trackingNumber || null,
    shippingCarrier: apiOrder.shippingCarrier || null,
    items: Array.isArray(apiOrder.items) ? apiOrder.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      name: item.name || (item.getName ? item.getName() : 'Product'),
      price: ensureValidNumber(item.price),
      quantity: parseInt(item.quantity) || 1,
      image: item.image || (item.getImage ? item.getImage() : null),
      sku: item.sku || (item.getSku ? item.getSku() : null),
      status: item.status || apiOrder.status || 'pending'
    })) : [],
    shippingAddress: apiOrder.shippingAddress || {
      firstName: '',
      lastName: '',
      address1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: ''
    },
    billingAddress: apiOrder.billingAddress || apiOrder.shippingAddress || {
      firstName: '',
      lastName: '',
      address1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: ''
    },
    subtotal: ensureValidNumber(apiOrder.subtotal),
    shippingCost: ensureValidNumber(apiOrder.shippingAmount || apiOrder.shippingCost),
    tax: ensureValidNumber(apiOrder.taxAmount || apiOrder.tax),
    discount: ensureValidNumber(apiOrder.discountAmount || apiOrder.discount),
    total: ensureValidNumber(apiOrder.totalAmount || apiOrder.total)
  };
} 