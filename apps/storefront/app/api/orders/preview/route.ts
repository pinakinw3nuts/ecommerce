import { NextRequest, NextResponse } from 'next/server';

// Mock order preview data
function generateOrderPreview(params: any) {
  return {
    items: [
      {
        id: "ci1",
        name: "Classic T-Shirt",
        quantity: 2,
        price: 19.99,
        total: 39.98
      },
      {
        id: "ci2",
        name: "Wireless Headphones",
        quantity: 1,
        price: 89.99,
        total: 89.99
      }
    ],
    address: {
      name: "John Doe",
      line1: params.addressId === "addr1" 
        ? "123 Main Street, Apt 4B" 
        : "456 Park Avenue",
      city: params.addressId === "addr1" ? "New York" : "Boston",
      state: params.addressId === "addr1" ? "NY" : "MA",
      country: "USA",
      pincode: params.addressId === "addr1" ? "10001" : "02108"
    },
    shipping: {
      method: params.shippingId === "standard" 
        ? "Standard Shipping" 
        : params.shippingId === "express" 
          ? "Express Shipping" 
          : "Overnight Shipping",
      rate: params.shippingId === "standard" 
        ? 4.99 
        : params.shippingId === "express" 
          ? 9.99 
          : 19.99,
      estimatedDays: params.shippingId === "standard" 
        ? 5 
        : params.shippingId === "express" 
          ? 2 
          : 1
    },
    payment: {
      method: params.paymentId === "cod" 
        ? "Cash on Delivery" 
        : params.paymentId === "stripe" 
          ? "Pay with Card" 
          : "Pay with PayPal",
      type: params.paymentId === "cod" 
        ? "COD" 
        : params.paymentId === "stripe" 
          ? "CARD" 
          : "DIGITAL"
    },
    subtotal: 129.97,
    total: 129.97 + (params.shippingId === "standard" 
      ? 4.99 
      : params.shippingId === "express" 
        ? 9.99 
        : 19.99)
  };
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const hasAuth = req.headers.get('authorization')?.startsWith('Bearer ');
    
    if (!hasAuth) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Parse the request body to get parameters
    const params = await req.json();
    
    if (!params.addressId || !params.shippingId || !params.paymentId) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }
    
    // Generate a preview based on the parameters
    const orderPreview = generateOrderPreview(params);
    
    return NextResponse.json(orderPreview);
  } catch (error) {
    console.error('Error generating order preview:', error);
    return new NextResponse('Failed to generate order preview', { status: 500 });
  }
} 