import { NextResponse } from 'next/server';

// Mock data - will be replaced with database calls
const mockProducts = Array.from({ length: 100 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: `Product ${i + 1}`,
  category: ['electronics', 'clothing', 'books', 'home'][Math.floor(Math.random() * 4)],
  price: Math.floor(Math.random() * 1000) + 0.99,
  stock: Math.floor(Math.random() * 100),
  status: ['in_stock', 'low_stock', 'out_of_stock'][Math.floor(Math.random() * 3)] as 'in_stock' | 'low_stock' | 'out_of_stock',
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
}));

export async function PATCH(request: Request) {
  try {
    const { productIds, status } = await request.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid product IDs' },
        { status: 400 }
      );
    }

    if (!['in_stock', 'low_stock', 'out_of_stock'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // In a real app, this would be a database transaction
    const updatedIds = [];
    for (const id of productIds) {
      const product = mockProducts.find(p => p.id === id);
      if (product) {
        product.status = status;
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