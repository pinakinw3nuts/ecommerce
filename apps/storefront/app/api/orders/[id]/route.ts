import { NextRequest, NextResponse } from 'next/server';

// Mock order data
function getMockOrder(id: string) {
  return {
    id,
    status: "Processing",
    createdAt: new Date().toISOString(),
    total: 145.36,
    items: [
      {
        name: "Classic T-Shirt",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop",
        price: 19.99,
        quantity: 2
      },
      {
        name: "Wireless Headphones",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1470&auto=format&fit=crop",
        price: 89.99,
        quantity: 1
      }
    ]
  };
}

// Helper function to extract id safely
async function extractId(params: any): Promise<string> {
  // In Next.js 14, params might be a Promise
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  return resolvedParams?.id || '';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For demo purposes, we'll skip authentication
    // In a real implementation, we would verify the JWT token
    
    // Extract id safely
    const id = await extractId(params);
    
    if (!id) {
      return new NextResponse('Order ID is required', { status: 400 });
    }
    
    // In a real implementation, we would fetch the order details from a database
    // For now, return mock data
    const orderDetails = getMockOrder(id);
    
    return NextResponse.json(orderDetails);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return new NextResponse('Failed to fetch order details', { status: 500 });
  }
} 