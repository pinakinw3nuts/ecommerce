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
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
  },
  // Add more mock products as needed
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const status = searchParams.get('status') || 'all';

    // Filter products based on search, category, and status
    let filteredProducts = [...mockProducts];

    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category !== 'all') {
      filteredProducts = filteredProducts.filter(product =>
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (status !== 'all') {
      switch (status) {
        case 'published':
          filteredProducts = filteredProducts.filter(product => product.isPublished);
          break;
        case 'draft':
          filteredProducts = filteredProducts.filter(product => !product.isPublished);
          break;
        case 'out_of_stock':
          filteredProducts = filteredProducts.filter(product => product.stock === 0);
          break;
      }
    }

    // Pagination
    const pageSize = 10;
    const total = filteredProducts.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedProducts = filteredProducts.slice(start, end);

    return NextResponse.json({
      products: paginatedProducts,
      total,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.price || !data.sku) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for duplicate SKU
    const existingProduct = mockProducts.find(p => p.sku === data.sku);
    if (existingProduct) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      );
    }

    // Create new product
    const newProduct = {
      id: `prod_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real app, this would be a database insert
    mockProducts.push(newProduct);

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 