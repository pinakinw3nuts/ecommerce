import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Mock data - will be replaced with database calls
const mockProducts = [
  {
    id: 'prod_1',
    name: 'Classic White T-Shirt',
    description: 'A comfortable white t-shirt made from 100% cotton.',
    price: 29.99,
    stock: 100,
    image: '/images/products/tshirt.jpg',
    isPublished: true,
    category: 'Clothing',
    sku: 'WT-CLS-M',
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
  },
  // Add more mock products as needed
];

export async function POST(request: Request) {
  try {
    const { productIds, isPublished } = await request.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid product IDs' },
        { status: 400 }
      );
    }

    if (typeof isPublished !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid publish status' },
        { status: 400 }
      );
    }

    // In a real app, this would be a database transaction
    const updatedIds = [];
    for (const id of productIds) {
      const product = mockProducts.find(p => p.id === id);
      if (product) {
        product.isPublished = isPublished;
        product.updatedAt = new Date().toISOString();
        updatedIds.push(id);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedIds.length,
      updatedIds,
    });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 