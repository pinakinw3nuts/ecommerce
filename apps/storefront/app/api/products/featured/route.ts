import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Mock featured products for fallback
const MOCK_FEATURED_PRODUCTS = [
  {
    id: 'featured-1',
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: 'Experience incredible sound quality with our premium wireless headphones.',
    price: 149.99,
    salePrice: 129.99,
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
    salePrice: null,
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
    salePrice: 179.99,
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
    salePrice: 1199.99,
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
 * GET handler for /api/products/featured
 * Returns featured products for client-side components
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '4');
    
    // In a real implementation, we would fetch from the product service
    // For now, just return the mock data
    return NextResponse.json({
      products: MOCK_FEATURED_PRODUCTS.slice(0, limit),
      total: MOCK_FEATURED_PRODUCTS.length
    });
  } catch (error) {
    console.error('Error in featured products API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
} 