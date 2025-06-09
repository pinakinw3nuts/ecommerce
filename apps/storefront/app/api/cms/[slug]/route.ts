import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

// Helper function to extract slug safely
async function extractSlug(params: any): Promise<string> {
  // In Next.js 14, params might be a Promise
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  return resolvedParams?.slug || '';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Extract slug safely
    const slug = await extractSlug(params);
    
    // Call the CMS service API through the API gateway
    const response = await axios.get(`${API_GATEWAY_URL}/v1/cms/pages/${slug}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching CMS page:', error);
    
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch page content', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 