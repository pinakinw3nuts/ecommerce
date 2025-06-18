// app/api/checkout/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CHECKOUT_API_URL = process.env.CHECKOUT_API_URL || 'http://localhost:3005/api/v1';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const query = req.nextUrl.searchParams.toString();
  const url = `${CHECKOUT_API_URL}/${path}${query ? `?${query}` : ''}`;

  try {
    const response = await axios.get(url);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: { path: string[] } }) {
  const params = await context.params;
  const path = params.path.join('/');
  const body = await req.json();
  console.log('path =====>', path);  
  console.log('body =====>', body);
  try {
    const response = await axios.post(`${CHECKOUT_API_URL}/${path}`, body);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
