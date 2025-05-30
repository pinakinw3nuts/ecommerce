import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Mock data - will be replaced with database calls
const mockPayments = Array.from({ length: 100 }, (_, i) => ({
  id: `payment-${i + 1}`,
  orderId: `ORD-${String(i + 1).padStart(6, '0')}`,
  amount: Math.floor(Math.random() * 1000) + 0.99,
  gateway: ['Stripe', 'Razorpay', 'COD', 'Invoice'][Math.floor(Math.random() * 4)] as 'Stripe' | 'Razorpay' | 'COD' | 'Invoice',
  status: ['PAID', 'FAILED', 'REFUNDED'][Math.floor(Math.random() * 3)] as 'PAID' | 'FAILED' | 'REFUNDED',
  timestamp: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  refundStatus: Math.random() > 0.8 ? {
    status: ['PENDING', 'COMPLETED', 'FAILED'][Math.floor(Math.random() * 3)] as 'PENDING' | 'COMPLETED' | 'FAILED',
    reason: Math.random() > 0.5 ? 'Customer requested refund' : undefined,
    refundedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString() : undefined,
  } : undefined,
}));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status')?.split(',') || [];
    const gateway = searchParams.get('gateway')?.split(',') || [];
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const amountMin = searchParams.get('amountMin');
    const amountMax = searchParams.get('amountMax');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || null;

    // Apply filters
    let filteredPayments = [...mockPayments];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = filteredPayments.filter(payment =>
        payment.orderId.toLowerCase().includes(searchLower)
      );
    }

    if (status.length > 0) {
      filteredPayments = filteredPayments.filter(payment =>
        status.includes(payment.status)
      );
    }

    if (gateway.length > 0) {
      filteredPayments = filteredPayments.filter(payment =>
        gateway.includes(payment.gateway)
      );
    }

    if (dateFrom) {
      filteredPayments = filteredPayments.filter(payment =>
        new Date(payment.timestamp) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filteredPayments = filteredPayments.filter(payment =>
        new Date(payment.timestamp) <= new Date(dateTo)
      );
    }

    if (amountMin) {
      filteredPayments = filteredPayments.filter(payment =>
        payment.amount >= parseFloat(amountMin)
      );
    }

    if (amountMax) {
      filteredPayments = filteredPayments.filter(payment =>
        payment.amount <= parseFloat(amountMax)
      );
    }

    // Apply sorting
    if (sortBy && sortOrder) {
      filteredPayments.sort((a: any, b: any) => {
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
    }

    // Apply pagination
    const total = filteredPayments.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedPayments = filteredPayments.slice(start, end);

    return NextResponse.json({
      payments: paginatedPayments,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        pageSize,
        hasMore: end < total,
        hasPrevious: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
} 