import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { orderIds } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order IDs provided' },
        { status: 400 }
      );
    }

    // In a real application, delete the orders from the database
    // For now, we'll just simulate success
    return NextResponse.json(
      { message: `${orderIds.length} orders deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting orders:', error);
    return NextResponse.json(
      { error: 'Failed to delete orders' },
      { status: 500 }
    );
  }
} 