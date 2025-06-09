import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    // Call the SEO service API through the API gateway
    const response = await axios.get(`${API_GATEWAY_URL}/v1/seo/sitemap`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching sitemap data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sitemap data', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 