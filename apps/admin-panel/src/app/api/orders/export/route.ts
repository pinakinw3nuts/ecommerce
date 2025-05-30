import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Mock data - will be replaced with database calls
const mockOrders = Array.from({ length: 100 }, (_, i) => ({
  id: `order-${i + 1}`,
  orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
  customerName: `Customer ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  total: Math.floor(Math.random() * 1000) + 0.99,
  status: ['pending', 'processing', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
  paymentStatus: ['paid', 'unpaid', 'refunded'][Math.floor(Math.random() * 3)],
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  updatedAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString(),
}));

export async function POST(request: Request) {
  try {
    const { orderIds } = await request.json();

    // Filter orders if specific IDs are provided
    const ordersToExport = orderIds === 'all'
      ? mockOrders
      : mockOrders.filter(order => orderIds.includes(order.id));

    // Convert orders to CSV format
    const headers = [
      'Order Number',
      'Customer Name',
      'Email',
      'Total',
      'Status',
      'Payment Status',
      'Created At',
      'Updated At',
    ];

    const rows = ordersToExport.map(order => [
      order.orderNumber,
      order.customerName,
      order.email,
      order.total.toFixed(2),
      order.status,
      order.paymentStatus,
      new Date(order.createdAt).toLocaleString(),
      new Date(order.updatedAt).toLocaleString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Create response with CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=orders.csv',
      },
    });
  } catch (error) {
    console.error('Error exporting orders:', error);
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    );
  }
} 