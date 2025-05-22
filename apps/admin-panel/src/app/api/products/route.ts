import { NextRequest, NextResponse } from 'next/server';

// Mock products data
const mockProducts = Array.from({ length: 100 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: `Product ${i + 1}`,
  category: ['electronics', 'clothing', 'books', 'home'][Math.floor(Math.random() * 4)],
  price: Math.floor(Math.random() * 1000) + 0.99,
  stock: Math.floor(Math.random() * 100),
  status: ['in_stock', 'low_stock', 'out_of_stock'][Math.floor(Math.random() * 3)] as 'in_stock' | 'low_stock' | 'out_of_stock',
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
}));

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get query params
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const search = searchParams.get('search') || '';
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Filter products
    let filteredProducts = [...mockProducts];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (categories.length > 0) {
      filteredProducts = filteredProducts.filter(product => categories.includes(product.category));
    }

    // Apply status filter
    if (statuses.length > 0) {
      filteredProducts = filteredProducts.filter(product => statuses.includes(product.status));
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    // Calculate pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedProducts = filteredProducts.slice(start, end);

    return NextResponse.json({
      products: paginatedProducts,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        pageSize,
        hasMore: page < totalPages,
        hasPrevious: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json();
    
    // In a real app, you would:
    // 1. Validate the product data
    // 2. Create the product in your database
    // 3. Return the created product
    
    // For now, we'll just return a mock response
    const newProduct = {
      id: `product-${mockProducts.length + 1}`,
      ...productData,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    
    // In a real app, you would:
    // 1. Validate the data
    // 2. Update the product in your database
    // 3. Return the updated product
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 