import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import axios from 'axios';
import { PRODUCT_API_URL } from '@/lib/constants';

/**
 * GET handler for /api/products
 * Proxies requests to the product service
 */
export async function GET(request: NextRequest) {
  try {
        
    // Get query parameters using the URL API to avoid Next.js warning
    const url = new URL(request.url);
    
    // Extract only the parameters we need to pass to the API
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '6';
    const category = url.searchParams.get('category') || undefined;
    const sort = url.searchParams.get('sort') || 'newest';
    const search = url.searchParams.get('search') || undefined;
    const minPrice = url.searchParams.get('minPrice') || undefined;
    const maxPrice = url.searchParams.get('maxPrice') || undefined;
    
    // Build params object with only defined values
    const params: Record<string, string> = { page, limit };
    
    // Map frontend sort options to backend sortBy and sortOrder parameters
    if (sort) {
      // Normalize sort parameter to handle dash (-) vs underscore (_) format
      const normalizedSort = sort.replace('-', '_');
      
      switch (normalizedSort) {
        case 'price_asc':
          params.sortBy = 'price';
          params.sortOrder = 'ASC';
          break;
        case 'price_desc':
          params.sortBy = 'price';
          params.sortOrder = 'DESC';
          break;
        case 'name_asc':
          params.sortBy = 'name';
          params.sortOrder = 'ASC';
          break;
        case 'name_desc':
          params.sortBy = 'name';
          params.sortOrder = 'DESC';
          break;
        case 'rating_desc':
          params.sortBy = 'rating';
          params.sortOrder = 'DESC';
          break;
        case 'newest':
        default:
          params.sortBy = 'createdAt';
          params.sortOrder = 'DESC';
          break;
      }
    }
    
    // Only add other parameters if they exist
    if (category) params.category = category;
    if (search) params.search = search;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    
    // Using the known working endpoint format
    const apiUrl = `${PRODUCT_API_URL}/products`;
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
    console.log('Product API request successful');
    
    // Return the response from the API
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Log detailed error information
    console.error('Error fetching products from API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to fetch products', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}