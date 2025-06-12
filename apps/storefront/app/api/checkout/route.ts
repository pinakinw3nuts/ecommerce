import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CHECKOUT_API_URL = process.env.CHECKOUT_API_URL || 'http://localhost:3005/api/v1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const path = req.nextUrl.pathname.replace('/api/checkout', '');
    
    console.log(`Proxying checkout request to: ${CHECKOUT_API_URL}${path}`, JSON.stringify(body));
    
    const response = await axios.post(`${CHECKOUT_API_URL}${path}`, body);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error in checkout proxy:', error.message);
    console.error('Request path:', req.nextUrl.pathname);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    
    return NextResponse.json(
      { 
        success: false,
        message: error.response?.data?.message || error.message || 'Checkout service error'
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname.replace('/api/checkout', '');
    const searchParams = req.nextUrl.searchParams.toString();
    const url = `${CHECKOUT_API_URL}${path}${searchParams ? '?' + searchParams : ''}`;
    
    console.log(`Proxying checkout GET request to: ${url}`);
    
    const response = await axios.get(url);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error in checkout proxy:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.response?.data?.message || error.message || 'Checkout service error'
      },
      { status: error.response?.status || 500 }
    );
  }
} 