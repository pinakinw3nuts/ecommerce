import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CHECKOUT_API_URL = process.env.CHECKOUT_API_URL || 'http://127.0.0.1:3005/api/v1';

export async function POST(req: NextRequest, context: { params: { id: string } }) {
    const { id } = await context.params;
    const body = await req.json();
    console.log('id =====>', id);
    console.log('body =====>', body);
    try {
        const response = await axios.post(`${CHECKOUT_API_URL}/session/${id}/complete`, body);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('POST /session/[id]/complete error:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Checkout service error' },
            { status: error.response?.status || 500 }
        );
    }
}