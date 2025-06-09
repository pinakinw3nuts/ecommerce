import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

/**
 * GET handler for /api/products/featured
 * Proxies requests to the API gateway
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '4';
    
    // Use explicit IPv4 address for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3000'
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
        
    console.log('Making API request to:', `${baseUrl}/v1/products/featured`);
    
    // Forward request to API gateway
    const response = await axios.get(`${baseUrl}/v1/products/featured`, {
      params: {
        limit,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Transform the API response to match the expected format
    const apiData = response.data;
    
    // Check if the API returned data in the expected format
    if (apiData && Array.isArray(apiData.data)) {
      // API returned data in a different format, transform it
      const transformedData = {
        products: apiData.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          image: product.mediaUrl || '/images/placeholder.jpg',
          category: product.category?.name?.toLowerCase() || 'uncategorized',
          categoryId: product.category?.id || '',
          rating: product.rating || 4.5,
          reviewCount: product.reviewCount || Math.floor(Math.random() * 50) + 5,
          inStock: true,
          discountedPrice: product.salePrice || null,
          isFeatured: true,
          isNew: product.isNew || false
        })),
        total: apiData.total || apiData.data.length
      };
      
      return NextResponse.json(transformedData);
    }
    
    // If the response already has the expected format, return it as is
    return NextResponse.json(apiData);
  } catch (error: any) {
    console.error('Error fetching featured products:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { error: 'Failed to fetch featured products', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 