import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { PRODUCT_API_URL } from '@/lib/constants';

// Force IPv4 by replacing localhost with 127.0.0.1 in the API URL
function getIpv4Url(url: string): string {
  return url.replace('localhost', '127.0.0.1');
}

/**
 * GET handler for /api/categories
 * Proxies requests to the product service
 */
export async function GET(request: NextRequest) {
  try {
    // Log request for debugging
    console.log(`Processing request to /api/categories: ${request.url}`);
    
    // Get query parameters using the URL API to avoid Next.js warning
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '50';
    
    // Build params object with only defined values
    const params: Record<string, string> = { 
      page, 
      limit,
      isActive: 'true'
    };
    
    // Log parameters for debugging
    console.log('Using API Parameters:', params);
    
    // Using the known working endpoint format with IPv4 forcing
    const apiUrl = getIpv4Url(`${PRODUCT_API_URL}/categories`);
    console.log(`Forwarding request to: ${apiUrl}`);
    
    // Make the request to the product service API
    const response = await axios.get(apiUrl, {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 5000 // 5 second timeout
    });
    
    // Log success
    console.log('Categories API request successful');
    
    // Check response format and transform if needed
    const apiData = response.data;
    
    // Check if the API returned data in the expected format (likely from admin endpoint)
    if (apiData && apiData.categories) {
      // Response is already in the expected format
      return NextResponse.json(apiData);
    } else if (apiData && apiData.data && Array.isArray(apiData.data)) {
      // Transform the API response to match the expected format
      const transformedData = {
        categories: apiData.data.map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
          description: category.description || '',
          image: category.imageUrl || '/images/placeholder.jpg',
          count: category.productCount || 0
        })),
        total: apiData.meta?.total || apiData.data.length,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil((apiData.meta?.total || apiData.data.length) / parseInt(limit, 10))
      };
      
      return NextResponse.json(transformedData);
    }
    
    // If the response is in an unexpected format, return it as is
    return NextResponse.json(apiData);
  } catch (error: any) {
    // Log detailed error information
    console.error('Error fetching categories from API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to fetch categories', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 