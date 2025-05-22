import { NextRequest, NextResponse } from 'next/server';

// Mock products data (same as in the main products route)
const mockProducts = Array.from({ length: 100 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: `Product ${i + 1}`,
  category: ['electronics', 'clothing', 'books', 'home'][Math.floor(Math.random() * 4)],
  price: Math.floor(Math.random() * 1000) + 0.99,
  stock: Math.floor(Math.random() * 100),
  status: ['in_stock', 'low_stock', 'out_of_stock'][Math.floor(Math.random() * 3)] as 'in_stock' | 'low_stock' | 'out_of_stock',
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
}));

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const product = mockProducts.find(p => p.id === params.id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productData = await request.json();
    
    // In a real app, you would:
    // 1. Validate the product data
    // 2. Update the product in your database
    // 3. Return the updated product
    
    // Check if product exists
    const product = mockProducts.find(p => p.id === params.id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Return mock response
    return NextResponse.json({
      ...product,
      ...productData,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In a real app, you would:
    // 1. Check if product exists
    // 2. Delete the product from your database
    // 3. Return success response
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 