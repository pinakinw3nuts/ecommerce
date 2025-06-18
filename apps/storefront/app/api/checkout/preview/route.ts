// app/api/checkout/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CHECKOUT_API_URL = process.env.CHECKOUT_API_URL || 'http://127.0.0.1:3005/api/v1';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();        
        console.log('Preview request body:', JSON.stringify(body, null, 2));
        const response = await axios.post(`${CHECKOUT_API_URL}/preview`, body);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('POST /preview error:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Checkout service error' },
            { status: error.response?.status || 500 }
        );
    }
}

