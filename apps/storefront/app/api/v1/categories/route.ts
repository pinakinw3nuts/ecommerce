import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import axios from 'axios';

// Define the product service URL
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    
    console.log(`Making API request to: ${PRODUCT_SERVICE_URL}/categories`);
    
    // Make the request to the product service
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/categories`, {
      params: {
        page,
        limit,
        isPublished: true
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Transform the response to match the expected format
    const apiData = response.data;
    
    if (apiData && apiData.data && Array.isArray(apiData.data)) {
      // Transform the categories data to match the expected format
      const transformedCategories = apiData.data.map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
        description: category.description || '',
        count: category.productCount || 0
      }));
      
      // Return the transformed data
      return NextResponse.json({
        categories: transformedCategories
      });
    }
    
    // If the response doesn't match the expected format, return it as is
    return NextResponse.json(apiData);
    
  } catch (error: any) {
    console.error('Error fetching categories from service:', error);
    
    // Fall back to empty response
    return NextResponse.json({
      categories: []
    });
  }
} 