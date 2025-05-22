import { NextResponse } from 'next/server';

// Mock data for a single order
const generateMockOrder = (id: string) => ({
  id,
  customerName: 'John Doe',
  customerEmail: 'john.doe@example.com',
  total: 299.99,
  status: 'processing' as const,
  createdAt: new Date().toISOString(),
  items: [
    {
      id: '1',
      productId: 'prod_1',
      productName: 'Premium Headphones',
      quantity: 1,
      price: 199.99,
    },
    {
      id: '2',
      productId: 'prod_2',
      productName: 'Wireless Mouse',
      quantity: 2,
      price: 49.99,
    },
  ],
  shippingInfo: {
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    country: 'United States',
  },
  notes: [
    'Customer requested gift wrapping',
    'Priority shipping selected',
  ],
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real application, you would fetch the order from a database
    // For now, we'll return mock data
    const order = generateMockOrder(params.id);

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    // In a real application, you would update the order in a database
    // For now, we'll just return a success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
} 