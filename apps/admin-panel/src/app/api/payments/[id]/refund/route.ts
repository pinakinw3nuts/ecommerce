import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3007';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    const { id } = params;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: 'Payment ID is required' }, { status: 400 });
    }

    // Get refund details from request body
    const body = await request.json();
    
    const apiUrl = `${PAYMENT_SERVICE_URL}/api/v1/payments/admin/payments/${id}/refund`;
    console.log('Initiating refund for payment ID:', id);
    console.log('Sending request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Error response from payment service:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to process refund',
          error: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error initiating refund:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to initiate refund' },
      { status: 500 }
    );
  }
} 