// app/api/checkout/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CHECKOUT_API_URL = process.env.CHECKOUT_API_URL || 'http://127.0.0.1:3005/api/v1';
console.log('CHECKOUT_API_URL', CHECKOUT_API_URL);
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const response = await axios.post(`${CHECKOUT_API_URL}/session`, body);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('POST /session error:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Checkout service error' },
            { status: error.response?.status || 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    const sessionId = req.nextUrl.pathname.split('/').pop();
    try {
        const response = await axios.get(`${CHECKOUT_API_URL}/session/${sessionId}`);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('GET /checkout/session error:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Checkout session fetch error' },
            { status: error.response?.status || 500 }
        );
    }
}
