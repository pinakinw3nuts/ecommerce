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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const productIndex = mockProducts.findIndex(p => p.id === params.id);

    if (productIndex === -1) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check for duplicate SKU if SKU is being changed
    if (data.sku && data.sku !== mockProducts[productIndex].sku) {
      const existingProduct = mockProducts.find(p => p.sku === data.sku);
      if (existingProduct) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        );
      }
    }

    // Update product
    const updatedProduct = {
      ...mockProducts[productIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // In a real app, this would be a database update
    mockProducts[productIndex] = updatedProduct;

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productIndex = mockProducts.findIndex(p => p.id === params.id);

    if (productIndex === -1) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // In a real app, this would be a database delete
    mockProducts.splice(productIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 