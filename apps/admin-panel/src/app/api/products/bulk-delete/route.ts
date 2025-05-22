import { NextResponse } from 'next/server';

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
    const { productIds } = await request.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid product IDs' },
        { status: 400 }
      );
    }

    // In a real app, this would be a database transaction
    const deletedIds = [];
    for (const id of productIds) {
      const index = mockProducts.findIndex(p => p.id === id);
      if (index !== -1) {
        mockProducts.splice(index, 1);
        deletedIds.push(id);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedIds.length,
      deletedIds,
    });
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 