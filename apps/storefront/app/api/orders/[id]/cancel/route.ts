import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ORDER_API_URL } from '@/lib/constants';
import { mapOrderFromApi } from '../../route';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!params.id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Call the order service API through the API gateway to cancel the order
    const response = await axios.post(
      `${ORDER_API_URL}/orders/${params.id}/cancel`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    
    // Map the response to match our frontend expected format
    const order = mapOrderFromApi(response.data);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 