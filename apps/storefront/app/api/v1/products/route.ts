import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import axios from 'axios';

// Define the product service URL
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '6';
    const sort = searchParams.get('sort') || 'newest';
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    
    // Map frontend sort options to backend sort options
    let sortBy: string;
    let sortOrder: string;
    
    // Normalize sort parameter to handle dash (-) vs underscore (_) format
    const normalizedSort = sort.replace('-', '_');
    
    switch (normalizedSort) {
      case 'price_asc':
        sortBy = 'price';
        sortOrder = 'ASC';
        break;
      case 'price_desc':
        sortBy = 'price';
        sortOrder = 'DESC';
        break;
      case 'name_asc':
        sortBy = 'name';
        sortOrder = 'ASC';
        break;
      case 'name_desc':
        sortBy = 'name';
        sortOrder = 'DESC';
        break;
      case 'rating_desc':
        sortBy = 'rating';
        sortOrder = 'DESC';
        break;
      case 'newest':
      default:
        sortBy = 'createdAt';
        sortOrder = 'DESC';
        break;
    }
    
    // Prepare query parameters for the product service
    const params: Record<string, string> = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    
    // Add optional filters if they exist
    if (category) {
      // We need to find the categoryId from the slug
      try {
        const categoryResponse = await axios.get(`${PRODUCT_SERVICE_URL}/categories`, {
          params: { slug: category }
        });
        
        if (categoryResponse.data && categoryResponse.data.data && categoryResponse.data.data.length > 0) {
          params.categoryId = categoryResponse.data.data[0].id;
        }
      } catch (error) {
        console.error('Error fetching category by slug:', error);
      }
    }
    
    if (brand) {
      // We need to find the brandId from the slug
      try {
        const brandResponse = await axios.get(`${PRODUCT_SERVICE_URL}/brands`, {
          params: { slug: brand }
        });
        
        if (brandResponse.data && brandResponse.data.data && brandResponse.data.data.length > 0) {
          params.brandId = brandResponse.data.data[0].id;
        }
      } catch (error) {
        console.error('Error fetching brand by slug:', error);
      }
    }
    
    if (minPrice) {
      params.minPrice = minPrice;
    }
    
    if (maxPrice) {
      params.maxPrice = maxPrice;
    }
    
    if (search) {
      params.search = search;
    }
    
    console.log(`Making API request to: ${PRODUCT_SERVICE_URL}/products with params:`, params);
    
    // Make the request to the product service
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/products`, {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Transform the response to match the expected format
    const apiData = response.data;
    
    if (apiData && apiData.products && Array.isArray(apiData.products)) {
      // Transform the products data to match the expected format
      const transformedProducts = apiData.products.map((product: any) => {
        // Check if image URL is from example.com (which causes 404s)
        let imageUrl = product.mediaUrl || '/images/placeholder.jpg';
        if (imageUrl.includes('example.com')) {
          // Replace with placeholder if it's from example.com
          imageUrl = '/images/placeholder.jpg';
        }
        
        return {
          id: product.id,
          name: product.name,
          slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
          price: product.price,
          salePrice: product.salePrice || null,
          imageUrl: imageUrl,
          brand: product.brand?.name || '',
          category: product.category?.name || '',
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
          description: product.description || ''
        };
      });
      
      // Return the transformed data
      return NextResponse.json({
        products: transformedProducts,
        total: apiData.pagination?.total || transformedProducts.length,
        totalPages: apiData.pagination?.totalPages || 1,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      });
    }
    
    // If the response doesn't match the expected format, return it as is
    return NextResponse.json(apiData);
    
  } catch (error: any) {
    console.error('Error fetching products from service:', error);
    
    // Fall back to empty response
    return NextResponse.json({
      products: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '12')
    });
  }
} 