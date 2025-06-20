import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ORDER_API_URL } from '@/lib/constants';
import { Order } from '@/lib/types/order';

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

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    // Forward the request to the order service
    const response = await fetch(
      `${ORDER_API_URL}/orders?page=${page}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

    // Map the response to match our frontend types
    return NextResponse.json({
      data: data.orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status.toLowerCase(),
        items: order.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          image: item.image,
          variantId: item.variantId,
          variantName: item.variantName,
          sku: item.sku,
        })),
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        shippingAmount: Number(order.shippingAmount),
        taxAmount: Number(order.taxAmount),
        discountAmount: Number(order.discountAmount),
        shippingAddress: {
          firstName: order.shippingAddress.firstName,
          lastName: order.shippingAddress.lastName,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
          phone: order.shippingAddress.phone,
        },
        billingAddress: order.billingAddress ? {
          firstName: order.billingAddress.firstName,
          lastName: order.billingAddress.lastName,
          street: order.billingAddress.street,
          city: order.billingAddress.city,
          state: order.billingAddress.state,
          postalCode: order.billingAddress.postalCode,
          country: order.billingAddress.country,
          phone: order.billingAddress.phone,
        } : undefined,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      meta: {
        total: data.total,
        totalPages: data.totalPages,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle single order operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(`${ORDER_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
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
    createdAt: apiOrder.createdAt,
    updatedAt: apiOrder.updatedAt,
    trackingNumber: apiOrder.trackingNumber || null,
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
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: ''
    },
    billingAddress: apiOrder.billingAddress || apiOrder.shippingAddress || {
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: ''
    },
    subtotal: ensureValidNumber(apiOrder.subtotal),
    shippingAmount: ensureValidNumber(apiOrder.shippingAmount || apiOrder.shippingCost),
    taxAmount: ensureValidNumber(apiOrder.taxAmount || apiOrder.tax),
    discountAmount: ensureValidNumber(apiOrder.discountAmount || apiOrder.discount),
    total: ensureValidNumber(apiOrder.totalAmount || apiOrder.total)
  };
} 