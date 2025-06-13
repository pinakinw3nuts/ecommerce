import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ORDER_API_URL } from '@/lib/constants';

// Import the mapping function from the parent route
import { mapOrderFromApi } from '../route';

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
    
    const response = await axios.get(`${ORDER_API_URL}/orders/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Map the response to match our frontend expected format
    const order = mapOrderFromApi(response.data);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(
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
    
    const body = await req.json();
    
    const response = await axios.put(
      `${ORDER_API_URL}/orders/${params.id}`,
      body,
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
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', message: error.message },
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