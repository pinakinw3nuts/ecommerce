import { NextResponse } from 'next/server';

// Mock data - will be replaced with database calls
const mockOrders = Array.from({ length: 100 }, (_, i) => ({
  id: `order-${i + 1}`,
  orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
  customerName: `Customer ${i + 1}`,
  customerEmail: `customer${i + 1}@example.com`,
  total: Math.floor(Math.random() * 1000) + 0.99,
  status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][Math.floor(Math.random() * 5)] as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  paymentStatus: ['paid', 'unpaid', 'refunded'][Math.floor(Math.random() * 3)] as 'paid' | 'unpaid' | 'refunded',
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  updatedAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString(),
  items: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, j) => ({
    id: `item-${i}-${j}`,
    productId: `product-${Math.floor(Math.random() * 100) + 1}`,
    productName: `Product ${Math.floor(Math.random() * 100) + 1}`,
    quantity: Math.floor(Math.random() * 5) + 1,
    price: Math.floor(Math.random() * 100) + 0.99,
  })),
  shippingInfo: {
    address: `${Math.floor(Math.random() * 9999) + 1} Main Street`,
    city: 'Sample City',
    state: 'ST',
    zipCode: String(Math.floor(Math.random() * 90000) + 10000),
    country: 'United States',
  },
  notes: [],
}));

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = mockOrders.find((o) => o.id === params.id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = mockOrders.find((o) => o.id === params.id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const updates = await request.json();
    Object.assign(order, updates);

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderIndex = mockOrders.findIndex((o) => o.id === params.id);

    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    mockOrders.splice(orderIndex, 1);

    return NextResponse.json(
      { message: 'Order deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
} 