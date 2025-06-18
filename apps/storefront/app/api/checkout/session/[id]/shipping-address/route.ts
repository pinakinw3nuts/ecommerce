import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CHECKOUT_API_URL = process.env.CHECKOUT_API_URL || 'http://127.0.0.1:3005/api/v1';

        
export async function PUT(req: NextRequest, context: { params: { id: string } }) {   
    const { id } = await context.params;    
    const body = await req.json();
    const payload = { address: body.address ? body.address : body };
    console.log('Payload sent to backend:', JSON.stringify(payload, null, 2));
    try {
        const response = await axios.put(`${CHECKOUT_API_URL}/session/${id}/shipping-address`, payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { message: error.response?.data?.message || 'Checkout service error' },
            { status: error.response?.status || 500 }
        );
    }
}