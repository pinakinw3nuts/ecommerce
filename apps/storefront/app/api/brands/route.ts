import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

/**
 * Process logo URL to ensure consistency
 * @param logoUrl Original logo URL from API
 */
function processLogoUrl(logoUrl: string | undefined | null, brandName: string): string {
  // Return placeholder if no logo
  if (!logoUrl) {
    return '/images/placeholder.jpg';
  }
  
  // If it's already a full URL, keep it
  if (logoUrl.startsWith('http')) {
    return logoUrl;
  }
  
  // If it's already a /storage/ path, use it directly
  if (logoUrl.startsWith('/storage/')) {
    return logoUrl;
  }
  
  // Extract the filename for direct access if it contains brands/
  if (logoUrl.includes('brands/')) {
    // Get just the filename
    const segments = logoUrl.split('/');
    const filename = segments[segments.length - 1];
    return `/storage/brands/${filename}`;
  }
  
  // If it has a /public/ prefix, remove it
  if (logoUrl.startsWith('/public/')) {
    const pathWithoutPublic = logoUrl.replace('/public/', '/');
    return pathWithoutPublic;
  }
  
  // Last attempt: if it's just a filename without path, assume it's in brands directory
  if (!logoUrl.includes('/')) {
    return `/storage/brands/${logoUrl}`;
  }
  
  // Add a leading slash if needed
  if (!logoUrl.startsWith('/')) {
    return `/${logoUrl}`;
  }
  
  // Return the path as is
  return logoUrl;
}

/**
 * GET handler for /api/brands
 * Proxies requests to the API gateway
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10';
    const page = searchParams.get('page') || '1';
    
    // Use explicit IPv4 address for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3000'
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
    
    // Forward request to API gateway
    const response = await axios.get(`${baseUrl}/v1/brands`, {
      params: {
        limit,
        page,
        isActive: true
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Transform the API response to match the expected format
    const apiData = response.data;
    
    // Check if the API returned data in the expected format
    if (apiData && Array.isArray(apiData)) {
      // API returned data in the expected format, transform it to our structure
      const transformedData = {
        brands: apiData.map((brand: any) => {
          // Process the logo URL
          const logoUrl = processLogoUrl(brand.logoUrl, brand.name);
          
          return {
            id: brand.id,
            name: brand.name,
            slug: brand.name.toLowerCase().replace(/\s+/g, '-'),
            description: brand.description || '',
            logo: logoUrl,
            logoUrl: logoUrl, // Include both for compatibility
            website: brand.website || '#',
            productCount: brand.products?.length || 0
          };
        }),
        total: apiData.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(apiData.length / parseInt(limit))
      };
      
      return NextResponse.json(transformedData);
    }
    
    // If the response already has the expected format, return it as is
    return NextResponse.json(apiData);
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { error: 'Failed to fetch brands', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 