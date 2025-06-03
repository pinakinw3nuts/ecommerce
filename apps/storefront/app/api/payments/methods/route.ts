import { NextRequest, NextResponse } from 'next/server';

// Mock payment methods
const mockPaymentMethods = {
  methods: [
    { 
      id: "cod", 
      name: "Cash on Delivery", 
      type: "COD", 
      label: "Cash on Delivery" 
    },
    { 
      id: "stripe", 
      name: "Stripe", 
      type: "CARD", 
      label: "Pay with Card" 
    },
    { 
      id: "paypal", 
      name: "PayPal", 
      type: "DIGITAL", 
      label: "Pay with PayPal" 
    }
  ]
};

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const hasAuth = req.headers.get('authorization')?.startsWith('Bearer ');
    
    if (!hasAuth) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // In a real implementation, we might filter available payment methods
    // based on user location, order value, or other factors
    
    return NextResponse.json(mockPaymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return new NextResponse('Failed to fetch payment methods', { status: 500 });
  }
} 