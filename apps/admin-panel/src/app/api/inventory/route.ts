import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Mock data for testing
const mockProducts = Array.from({ length: 50 }, (_, i) => ({
  id: `prod_${i + 1}`,
  sku: `SKU${String(i + 1).padStart(4, '0')}`,
  name: `Product ${i + 1}`,
  category: ['electronics', 'clothing', 'books', 'home', 'sports', 'toys'][Math.floor(Math.random() * 6)],
  status: ['in_stock', 'low_stock', 'out_of_stock'][Math.floor(Math.random() * 3)],
  quantity: Math.floor(Math.random() * 100),
  price: Number((Math.random() * 1000).toFixed(2)),
  lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString(),
}));

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const categories = searchParams.get('categories')?.split(',') || [];
    const statuses = searchParams.get('status')?.split(',') || [];
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minStock = searchParams.get('minStock');
    const maxStock = searchParams.get('maxStock');
    const sortBy = searchParams.get('sortBy') || 'lastUpdated';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Filter products
    let filteredProducts = [...mockProducts];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (categories.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        categories.includes(product.category)
      );
    }

    // Apply status filter
    if (statuses.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        statuses.includes(product.status)
      );
    }

    // Apply price range filter
    if (minPrice) {
      filteredProducts = filteredProducts.filter(product =>
        product.price >= Number(minPrice)
      );
    }
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(product =>
        product.price <= Number(maxPrice)
      );
    }

    // Apply stock range filter
    if (minStock) {
      filteredProducts = filteredProducts.filter(product =>
        product.quantity >= Number(minStock)
      );
    }
    if (maxStock) {
      filteredProducts = filteredProducts.filter(product =>
        product.quantity <= Number(maxStock)
      );
    }

    // Sort products
    filteredProducts.sort((a: any, b: any) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
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
        hasPrevious: page > 1
      }
    });
  } catch (error) {
    console.error('Inventory API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Mock successful response
    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: {
        id: `prod_${mockProducts.length + 1}`,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// Bulk delete endpoint
export async function DELETE(request: Request) {
  try {
    const { productIds } = await request.json();
    
    // Mock successful response
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${productIds.length} products`,
      deletedIds: productIds
    });
  } catch (error) {
    console.error('Delete Products Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete products' },
      { status: 500 }
    );
  }
} 