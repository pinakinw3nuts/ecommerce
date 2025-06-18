import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CHECKOUT_API_URL = process.env.CHECKOUT_API_URL || 'http://127.0.0.1:3005/api/v1';

export async function GET(req: NextRequest, context: { params: { id: string } }) {
    const { id } = await context.params;
    try {
        const response = await axios.get(`${CHECKOUT_API_URL}/session/${id}`);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('GET /session/[id] error:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Checkout session fetch error' },
            { status: error.response?.status || 500 }
        );
    }
}