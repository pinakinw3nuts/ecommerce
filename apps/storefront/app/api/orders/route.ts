import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ORDER_API_URL } from '@/lib/constants';
import { Order } from '@/lib/types/order';

export async function GET(req: NextRequest) {
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
    
    // Get query parameters for pagination and filtering
    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '10';
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Call the order service API through the API gateway
    const response = await axios.get(`${ORDER_API_URL}/orders`, {
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
    });
    
    // Map the response to match our frontend expected format
    const orders = response.data.data.map((order: any) => mapOrderFromApi(order));
    
    return NextResponse.json({
      orders,
      pagination: {
        total: response.data.meta.total,
        totalPages: response.data.meta.totalPages,
        currentPage: Number(page),
        pageSize: Number(pageSize),
        hasMore: Number(page) < response.data.meta.totalPages,
        hasPrevious: Number(page) > 1
      }
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', message: error.message },
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

// Helper function to map the order service response to our frontend model
export function mapOrderFromApi(apiOrder: any): Order {
  // Map the order status from the API to our frontend model
  const statusMap: Record<string, Order['status']> = {
    'PENDING': 'pending',
    'CONFIRMED': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'FAILED': 'cancelled'
  };

  // Map the payment status
  let paymentStatus: Order['paymentStatus'] = 'pending';
  if (apiOrder.metadata && apiOrder.metadata.paymentStatus) {
    paymentStatus = apiOrder.metadata.paymentStatus;
  }
  
  return {
    id: apiOrder.id,
    orderNumber: apiOrder.id.substring(0, 8).toUpperCase(),
    userId: apiOrder.userId,
    items: apiOrder.items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      name: item.metadata?.name || `Product ${item.productId.substring(0, 6)}`,
      image: item.metadata?.image,
      sku: item.metadata?.sku
    })),
    status: statusMap[apiOrder.status] || 'pending',
    paymentStatus,
    shippingAddress: {
      firstName: apiOrder.shippingAddress.firstName || '',
      lastName: apiOrder.shippingAddress.lastName || '',
      address1: apiOrder.shippingAddress.street || '',
      address2: apiOrder.shippingAddress.address2 || '',
      city: apiOrder.shippingAddress.city || '',
      state: apiOrder.shippingAddress.state || '',
      postalCode: apiOrder.shippingAddress.postalCode || '',
      country: apiOrder.shippingAddress.country || '',
      phone: apiOrder.shippingAddress.phone || ''
    },
    billingAddress: apiOrder.billingAddress ? {
      firstName: apiOrder.billingAddress.firstName || '',
      lastName: apiOrder.billingAddress.lastName || '',
      address1: apiOrder.billingAddress.street || '',
      address2: apiOrder.billingAddress.address2 || '',
      city: apiOrder.billingAddress.city || '',
      state: apiOrder.billingAddress.state || '',
      postalCode: apiOrder.billingAddress.postalCode || '',
      country: apiOrder.billingAddress.country || '',
      phone: apiOrder.billingAddress.phone || ''
    } : undefined,
    subtotal: apiOrder.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
    tax: apiOrder.taxAmount || 0,
    shippingCost: apiOrder.shippingAmount || 0,
    discount: apiOrder.discountAmount || 0,
    total: apiOrder.totalAmount || 0,
    createdAt: apiOrder.createdAt,
    updatedAt: apiOrder.updatedAt
  };
} 