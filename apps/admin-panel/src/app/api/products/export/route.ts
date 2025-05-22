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

    // Get products to export
    let productsToExport = mockProducts;
    if (Array.isArray(productIds) && productIds.length > 0) {
      productsToExport = mockProducts.filter(p => productIds.includes(p.id));
    }

    // Convert products to CSV
    const headers = [
      'ID',
      'SKU',
      'Name',
      'Description',
      'Price',
      'Stock',
      'Category',
      'Status',
      'Created At',
      'Updated At',
    ];

    const rows = productsToExport.map(product => [
      product.id,
      product.sku,
      product.name,
      product.description,
      product.price,
      product.stock,
      product.category,
      product.isPublished ? 'Published' : 'Draft',
      new Date(product.createdAt).toLocaleDateString(),
      new Date(product.updatedAt).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Create response with CSV file
    const response = new NextResponse(csv);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set(
      'Content-Disposition',
      'attachment; filename=products.csv'
    );

    return response;
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 