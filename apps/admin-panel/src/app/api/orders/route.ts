import { NextResponse } from 'next/server';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// Mock data
const orders = Array.from({ length: 50 }, (_, i) => ({
  id: `ord_${(i + 1).toString().padStart(6, '0')}`,
  customerName: `Customer ${i + 1}`,
  total: Math.floor(Math.random() * 1000) + 50,
  status: statuses[Math.floor(Math.random() * statuses.length)],
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  items: Array.from(
    { length: Math.floor(Math.random() * 4) + 1 },
    (_, j) => ({
      id: `item_${i}_${j}`,
      productId: `prod_${Math.floor(Math.random() * 50) + 1}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      price: Math.floor(Math.random() * 100) + 10,
    })
  ),
}));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 10;

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedOrders = orders.slice(start, end);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json({
    orders: paginatedOrders,
    total: orders.length,
  });
} 