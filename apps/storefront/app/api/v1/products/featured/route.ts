import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Define the product service URL
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';

// Mock featured products for fallback
const MOCK_FEATURED_PRODUCTS = [
  {
    id: 'featured-1',
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: 'Experience incredible sound quality with our premium wireless headphones.',
    price: 149.99,
    discountedPrice: 129.99,
    rating: 4.8,
    reviewCount: 156,
    mediaUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format',
    category: 'electronics',
    categoryId: 'electronics',
    inStock: true,
    isFeatured: true,
    isNew: true
  },
  {
    id: 'featured-2',
    name: 'Luxury Watch Collection',
    slug: 'luxury-watch-collection',
    description: 'Elevate your style with our luxury watch collection.',
    price: 299.99,
    discountedPrice: null,
    rating: 4.9,
    reviewCount: 78,
    mediaUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format',
    category: 'accessories',
    categoryId: 'accessories',
    inStock: true,
    isFeatured: true,
    isNew: false
  },
  {
    id: 'featured-3',
    name: 'Designer Leather Bag',
    slug: 'designer-leather-bag',
    description: 'A sophisticated leather bag perfect for any occasion.',
    price: 199.99,
    discountedPrice: 179.99,
    rating: 4.7,
    reviewCount: 93,
    mediaUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format',
    category: 'accessories',
    categoryId: 'accessories',
    inStock: true,
    isFeatured: true,
    isNew: true
  },
  {
    id: 'featured-4',
    name: 'Ultra-Slim Laptop',
    slug: 'ultra-slim-laptop',
    description: 'Powerful performance in an ultra-slim design.',
    price: 1299.99,
    discountedPrice: 1199.99,
    rating: 4.6,
    reviewCount: 45,
    mediaUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&auto=format',
    category: 'electronics',
    categoryId: 'electronics',
    inStock: true,
    isFeatured: true,
    isNew: true
  }
];

/**
 * GET handler for /api/v1/products/featured
 * Proxies requests to the product service API
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '4');
    
    // Prepare query parameters for the product service
    const params: Record<string, string> = {
      limit: limit.toString(),
      page: '1',
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    };
    
    // Add the featured filter
    params.isFeatured = 'true';
    
    console.log(`Making API request to: ${PRODUCT_SERVICE_URL}/api/v1/products with params:`, params);
    
    // Make the request to the product service
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/v1/products`, {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 3000 // 3 second timeout
    });
    
    // Transform the response to match the expected format
    const apiData = response.data;
    
    if (apiData && apiData.products && Array.isArray(apiData.products)) {
      // Format already matches what we need
      return NextResponse.json(apiData);
    } else if (apiData && Array.isArray(apiData.data)) {
      // API returned data in a different format, transform it
      const transformedData = {
        products: apiData.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          mediaUrl: product.mediaUrl || '/images/placeholder.jpg',
          category: product.category?.name?.toLowerCase() || 'uncategorized',
          categoryId: product.category?.id || '',
          rating: product.rating || 4.5,
          reviewCount: product.reviewCount || Math.floor(Math.random() * 50) + 5,
          inStock: true,
          salePrice: product.salePrice || null,
          isFeatured: true,
          isNew: product.isNew || false
        })),
        total: apiData.total || apiData.data.length
      };
      
      return NextResponse.json(transformedData);
    }
    
    // If the response format is unknown, return mock data
    console.log('Unexpected API response format, returning mock data');
    return NextResponse.json({
      products: MOCK_FEATURED_PRODUCTS.slice(0, limit),
      total: MOCK_FEATURED_PRODUCTS.length
    });
    
  } catch (error: any) {
    console.error('Error fetching featured products:', error);
    
    // Return mock featured products as fallback
    console.log('Returning mock featured products as fallback');
    return NextResponse.json({
      products: MOCK_FEATURED_PRODUCTS.slice(0, parseInt(request.nextUrl.searchParams.get('limit') || '4')),
      total: MOCK_FEATURED_PRODUCTS.length
    });
  }
} 