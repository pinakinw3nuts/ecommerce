import { NextResponse } from 'next/server';
import { bulkDeleteProducts } from '@/services/products';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



export async function POST(request: Request) {
  try {
    const { productIds } = await request.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid product IDs' },
        { status: 400 }
      );
    }

    await bulkDeleteProducts(productIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 