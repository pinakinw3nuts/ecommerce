import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

export async function GET(
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
    
    const response = await axios.get(`${API_GATEWAY_URL}/v1/orders/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}

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
    
    const { action } = await req.json();
    
    if (action === 'cancel') {
      const response = await axios.post(
        `${API_GATEWAY_URL}/v1/orders/${params.id}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      
      return NextResponse.json(response.data);
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error processing order action:', error);
    return NextResponse.json(
      { error: 'Failed to process order action', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}