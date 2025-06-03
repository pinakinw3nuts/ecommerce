import { NextRequest, NextResponse } from 'next/server';

// Mock orders list
const mockOrders = [
  {
    id: "ORD-ABC123XYZ",
    status: "Delivered",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    total: 145.36
  },
  {
    id: "ORD-DEF456UVW",
    status: "Processing",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    total: 79.99
  },
  {
    id: "ORD-GHI789RST",
    status: "Shipped",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    total: 214.97
  }
];

export async function GET(req: NextRequest) {
  try {
    // For demo purposes, we'll skip authentication
    // In a real implementation, we would verify the JWT token
    
    // Return the mock orders data
    return NextResponse.json(mockOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return new NextResponse('Failed to fetch orders', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // For demo purposes, we'll skip authentication
    // In a real implementation, we would verify the JWT token
    
    // Parse the request body
    const body = await req.json();
    
    if (!body.addressId || !body.shippingId || !body.paymentId) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }
    
    // In a real implementation, we would:
    // 1. Verify the cart contents
    // 2. Process payment through the payment service
    // 3. Create an order in the order service
    
    // Generate a random order ID
    const orderId = 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Return the created order ID
    return NextResponse.json({ id: orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    return new NextResponse('Failed to create order', { status: 500 });
  }
} 