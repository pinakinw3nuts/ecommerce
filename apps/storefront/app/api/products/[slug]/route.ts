import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    // Use explicit IPv4 address for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3000'
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
        
    console.log('Making API request to:', `${baseUrl}/v1/products/slug/${slug}`);
    
    // Call the product service API through the API gateway
    const response = await axios.get(`${baseUrl}/v1/products/slug/${slug}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Transform the API response to match the expected format
    const apiData = response.data;
    
    // Check if the API returned data in the different format
    if (apiData && apiData.data) {
      const product = apiData.data;
      // Transform to the expected format
      const transformedData = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        image: product.mediaUrl || '/images/placeholder.jpg',
        category: product.category?.name?.toLowerCase() || 'uncategorized',
        categoryId: product.category?.id || '',
        brand: product.brand || 'Generic',
        rating: product.rating || 4.5,
        reviewCount: product.reviewCount || Math.floor(Math.random() * 50) + 5,
        inStock: true,
        discountedPrice: product.salePrice || null,
        isFeatured: product.isFeatured || false,
        isNew: product.isNew || false,
        variants: product.variants || [],
        attributes: product.attributes || {},
        tags: product.tags || []
      };
      
      return NextResponse.json(transformedData);
    }
    
    // If the response already has the expected format, return it as is
    return NextResponse.json(apiData);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 