import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

// Generate a mock product based on the slug
function generateMockProduct(slug: string) {
  const productNumber = parseInt(slug.replace(/[^0-9]/g, '') || '1');
  
  return {
    id: `mock-${slug}`,
    name: slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    slug: slug,
    description: `This is a detailed description for ${slug}. It includes all the features and benefits you'd expect from a high-quality product. Perfect for any occasion and built to last.`,
    price: 19.99 + (productNumber * 10),
    discountedPrice: productNumber % 3 === 0 ? (19.99 + (productNumber * 10)) * 0.8 : null,
    rating: 4.5,
    reviewCount: 10 + productNumber,
    images: [
      'https://via.placeholder.com/800x800',
      'https://via.placeholder.com/800x800?text=Image+2',
      'https://via.placeholder.com/800x800?text=Image+3',
      'https://via.placeholder.com/800x800?text=Image+4'
    ],
    colors: ['Black', 'White', 'Blue', 'Red'].slice(0, (productNumber % 4) + 1),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'].slice(0, (productNumber % 5) + 1),
    category: productNumber % 5 === 0 ? 'electronics' : 
              productNumber % 5 === 1 ? 'clothing' : 
              productNumber % 5 === 2 ? 'home-kitchen' : 
              productNumber % 5 === 3 ? 'beauty' : 'books',
    brand: ['Apple', 'Samsung', 'Nike', 'Adidas', 'Amazon'][productNumber % 5],
    inStock: true,
    isFeatured: productNumber % 7 === 0,
    isNew: productNumber % 5 === 0,
    variants: [],
    attributes: {
      material: ['Cotton', 'Polyester', 'Leather', 'Metal', 'Glass'][productNumber % 5],
      weight: `${(productNumber % 10) + 0.5} kg`,
      dimensions: `${(productNumber % 10) + 10} x ${(productNumber % 8) + 5} x ${(productNumber % 5) + 2} cm`
    },
    tags: ['popular', 'trending', 'sale', 'new-arrival', 'limited-edition'].slice(0, (productNumber % 5) + 1)
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    // Use explicit IPv4 address for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3003/api/v1'
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
        
    console.log('Making API request to:', `${baseUrl}products/slug/${slug}`);
    
    // Call the product service API through the API gateway
    const response = await axios.get(`${baseUrl}products/slug/${slug}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 3000 // 3 second timeout to prevent long requests
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
    
    // Generate and return mock product data
    console.log(`Returning mock product data for ${params.slug}`);
    const mockProduct = generateMockProduct(params.slug);
    return NextResponse.json(mockProduct);
  }
} 