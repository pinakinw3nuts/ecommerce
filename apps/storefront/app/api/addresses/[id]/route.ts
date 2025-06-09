import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

// Helper function to extract id safely
async function extractId(params: any): Promise<string> {
  // In Next.js 14, params might be a Promise
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  return resolvedParams?.id || '';
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value;

    // Extract id safely
    const id = await extractId(params);
    
    // Parse the request body
    const body = await req.json();
    
    // Call the user service API through the API gateway
    const response = await axios.put(`${API_GATEWAY_URL}/v1/addresses/${id}`, body, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user token from the request cookies
    const token = req.cookies.get('accessToken')?.value;

    // Extract id safely
    const id = await extractId(params);
    
    // Call the user service API through the API gateway
    await axios.delete(`${API_GATEWAY_URL}/v1/addresses/${id}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 