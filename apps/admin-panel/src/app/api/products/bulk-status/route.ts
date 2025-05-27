import { NextResponse } from 'next/server';
import { bulkUpdateProductStatus } from '@/services/products';

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

    await bulkUpdateProductStatus(productIds, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 