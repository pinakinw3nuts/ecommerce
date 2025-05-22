import { NextResponse } from 'next/server';

// Mock data generator for payments
const generateMockPayments = () => {
  const gateways = ['Stripe', 'Razorpay', 'COD', 'Invoice'] as const;
  const statuses = ['PAID', 'FAILED', 'REFUNDED'] as const;

  return Array.from({ length: 50 }, (_, i) => {
    const id = `pmt_${(i + 1).toString().padStart(6, '0')}`;
    const orderId = `ord_${(i + 1).toString().padStart(6, '0')}`;
    const gateway = gateways[Math.floor(Math.random() * gateways.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.floor(Math.random() * 1000) + 50; // Random amount between 50 and 1050
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(); // Random date in last 30 days

    // Add refund status for some REFUNDED payments
    const refundStatus = status === 'REFUNDED' ? {
      status: 'COMPLETED' as const,
      reason: 'Customer requested refund',
      refundedAt: new Date(new Date(timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day after payment
    } : undefined;

    return {
      id,
      orderId,
      amount,
      gateway,
      status,
      timestamp,
      refundStatus,
    };
  });
};

export async function GET() {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real application, you would fetch payments from a database or payment service
    const payments = generateMockPayments();

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
} 