import { NextRequest, NextResponse } from 'next/server';

// Mock checkout preview data
const mockCheckoutPreview = {
  items: [
    {
      id: "ci1",
      name: "Classic T-Shirt",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop",
      price: 19.99,
      quantity: 2,
      total: 39.98
    },
    {
      id: "ci2",
      name: "Wireless Headphones",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1470&auto=format&fit=crop",
      price: 89.99,
      quantity: 1,
      total: 89.99
    }
  ],
  subtotal: 129.97,
  tax: 10.40,
  shipping: 4.99,
  total: 145.36
};

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const hasAuth = req.headers.get('authorization')?.startsWith('Bearer ');
    
    if (!hasAuth) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    if (!body.addressId || !body.shippingId || !body.paymentId) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }
    
    // In a real implementation, we would calculate the preview based on:
    // 1. The items in the user's cart
    // 2. The selected shipping method
    // 3. The user's address (for tax calculation)
    
    // For now, just return mock data
    // We could adjust shipping cost based on the selected shipping method
    let preview = { ...mockCheckoutPreview };
    
    if (body.shippingId === 'express') {
      preview.shipping = 9.99;
      preview.total = preview.subtotal + preview.tax + 9.99;
    } else if (body.shippingId === 'overnight') {
      preview.shipping = 19.99;
      preview.total = preview.subtotal + preview.tax + 19.99;
    }
    
    return NextResponse.json(preview);
  } catch (error) {
    console.error('Error generating checkout preview:', error);
    return new NextResponse('Failed to generate checkout preview', { status: 500 });
  }
} 