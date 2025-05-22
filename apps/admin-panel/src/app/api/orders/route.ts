import { NextResponse } from 'next/server';

// Mock data - will be replaced with database calls
const mockOrders = Array.from({ length: 100 }, (_, i) => ({
  id: `order-${i + 1}`,
  orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
  customerName: `Customer ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  total: Math.floor(Math.random() * 1000) + 0.99,
  status: ['pending', 'processing', 'completed', 'cancelled'][Math.floor(Math.random() * 4)] as 'pending' | 'processing' | 'completed' | 'cancelled',
  paymentStatus: ['paid', 'unpaid', 'refunded'][Math.floor(Math.random() * 3)] as 'paid' | 'unpaid' | 'refunded',
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  updatedAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString(),
}));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status')?.split(',').filter(Boolean) || [];
    const paymentStatus = searchParams.get('paymentStatus')?.split(',').filter(Boolean) || [];
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let filteredOrders = [...mockOrders];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = filteredOrders.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower) ||
          order.email.toLowerCase().includes(searchLower)
      );
    }

    if (status.length) {
      filteredOrders = filteredOrders.filter((order) =>
        status.includes(order.status)
      );
    }

    if (paymentStatus.length) {
      filteredOrders = filteredOrders.filter((order) =>
        paymentStatus.includes(order.paymentStatus)
      );
    }

    if (dateFrom) {
      filteredOrders = filteredOrders.filter(
        (order) => new Date(order.createdAt) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filteredOrders = filteredOrders.filter(
        (order) => new Date(order.createdAt) <= new Date(dateTo)
      );
    }

    if (priceMin) {
      filteredOrders = filteredOrders.filter(
        (order) => order.total >= parseFloat(priceMin)
      );
    }

    if (priceMax) {
      filteredOrders = filteredOrders.filter(
        (order) => order.total <= parseFloat(priceMax)
      );
    }

    // Apply sorting
    filteredOrders.sort((a: any, b: any) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Apply pagination
    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedOrders = filteredOrders.slice(start, end);

    return NextResponse.json({
      orders: paginatedOrders,
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
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const order = await request.json();
    // In a real application, validate and save the order to the database
    return NextResponse.json(
      { message: 'Order created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 