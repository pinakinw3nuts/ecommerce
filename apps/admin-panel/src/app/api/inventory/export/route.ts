import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { productIds } = await request.json();
    
    // Generate CSV content
    const headers = ['SKU', 'Name', 'Category', 'Status', 'Quantity', 'Price', 'Last Updated'];
    const rows = [headers];

    // Mock data for export
    const mockData = Array.from({ length: 10 }, (_, i) => [
      `SKU${String(i + 1).padStart(4, '0')}`,
      `Product ${i + 1}`,
      ['Electronics', 'Clothing', 'Books'][Math.floor(Math.random() * 3)],
      ['In Stock', 'Low Stock', 'Out of Stock'][Math.floor(Math.random() * 3)],
      Math.floor(Math.random() * 100).toString(),
      (Math.random() * 1000).toFixed(2),
      new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ]);

    rows.push(...mockData);

    // Convert to CSV
    const csv = rows.map(row => row.join(',')).join('\n');

    // Create response with CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=inventory.csv'
      }
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to export inventory data' },
      { status: 500 }
    );
  }
} 