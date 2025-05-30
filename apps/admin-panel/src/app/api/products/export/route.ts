import { NextResponse } from 'next/server';
import { exportProducts } from '@/services/products';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



export async function POST(request: Request) {
  try {
    const filters = await request.json();

    // Get the exported data blob
    const exportBlob = await exportProducts(filters);

    // Convert blob to text for the response
    const csvData = await exportBlob.text();

    // Create response with CSV file
    const csvResponse = new NextResponse(csvData);
    csvResponse.headers.set('Content-Type', 'text/csv');
    csvResponse.headers.set(
      'Content-Disposition',
      'attachment; filename=products.csv'
    );

    return csvResponse;
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 