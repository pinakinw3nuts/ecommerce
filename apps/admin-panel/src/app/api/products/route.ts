import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProducts } from '@/services/products';
import { prepareDateFields } from '@/lib/make-request';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

async function makeRequest(url: string, options: RequestInit = {}) {
  console.log('Making request to:', url);
  try {
    // Ensure URL is properly formatted
    const parsedUrl = new URL(url);
    
    // Log the exact URL components being sent
    console.log('URL details:', {
      href: parsedUrl.href,
      origin: parsedUrl.origin,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      searchParams: Object.fromEntries(parsedUrl.searchParams.entries())
    });
    
    const response = await fetch(parsedUrl.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    console.log('Response status:', response.status);
    return response;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Parse and validate sorting parameters
    const requestedSortBy = searchParams.get('sortBy') || 'createdAt';
    const allowedSortFields = ['name', 'price', 'createdAt'];
    const sortBy = allowedSortFields.includes(requestedSortBy) ? requestedSortBy : 'createdAt';
    
    if (sortBy !== requestedSortBy) {
      console.warn(`Requested sort field '${requestedSortBy}' is not supported. Using '${sortBy}' instead.`);
    }
    
    // Ensure sortOrder is uppercase for API compatibility
    const sortOrder = (searchParams.get('sortOrder') || 'DESC').toUpperCase();
    
    // Parse filtering parameters
    const search = searchParams.get('search') || '';
    
    // Handle both single and multiple category selections
    const categoryId = searchParams.get('categoryId');
    const categoryIds = searchParams.get('categoryIds')?.split(',');
    
    // Log category filter parameters for debugging
    console.log('Category filter parameters:', {
      categoryId,
      categoryIds,
      categories: searchParams.get('categories')
    });
    
    // Create a dynamic filter object to store all filter values
    const filterParams: Record<string, any> = {
      search,
      sortBy,
      sortOrder,
      page,
      pageSize
    };
    
    // Add category filter - use categoryId directly instead of categories array
    if (categoryId) {
      // Single category selection
      filterParams.categoryId = categoryId;
      console.log(`Setting single categoryId filter: ${categoryId}`);
    } else if (categoryIds && categoryIds.length > 0) {
      // Multiple category selection
      filterParams.categoryIds = categoryIds.join(',');
      console.log(`Setting multiple categoryIds filter: ${categoryIds.join(',')}`);
    } else {
      // Check for legacy 'categories' parameter
      const legacyCategories = searchParams.get('categories')?.split(',') || [];
      if (legacyCategories.length > 0) {
        if (legacyCategories.length === 1) {
          filterParams.categoryId = legacyCategories[0];
          console.log(`Setting legacy single categoryId filter: ${legacyCategories[0]}`);
        } else {
          filterParams.categoryIds = legacyCategories.join(',');
          console.log(`Setting legacy multiple categoryIds filter: ${legacyCategories.join(',')}`);
        }
      }
    }
    
    const statuses = searchParams.get('statuses')?.split(',') || [];
    if (statuses.length > 0) {
      filterParams.statuses = statuses;
    }
    
    // Handle price range - note API expects minPrice/maxPrice
    const minPrice = searchParams.get('minPrice') || searchParams.get('priceMin');
    const maxPrice = searchParams.get('maxPrice') || searchParams.get('priceMax');
    const priceMin = minPrice ? parseFloat(minPrice) : undefined;
    const priceMax = maxPrice ? parseFloat(maxPrice) : undefined;
    
    if (priceMin !== undefined || priceMax !== undefined) {
      filterParams.minPrice = priceMin;
      filterParams.maxPrice = priceMax;
    }
    
    // Process date filters if present
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      filterParams.dateRange = {};
      if (dateFrom) filterParams.dateRange.from = dateFrom;
      if (dateTo) filterParams.dateRange.to = dateTo;
    }
    
    // Process boolean filters (isFeatured, isPublished)
    // Handle isFeatured filter
    const isFeaturedValue = searchParams.get('isFeatured');
    if (isFeaturedValue !== null) {
      // Convert 'true'/'false' string to actual boolean for API
      const boolValue = isFeaturedValue.toLowerCase() === 'true';
      // Send boolean value directly to the backend, not as an array
      filterParams.isFeatured = boolValue;
      console.log(`Setting isFeatured filter to boolean: ${boolValue}`);
    }
    
    // Handle isPublished filter
    const isPublishedValue = searchParams.get('isPublished');
    if (isPublishedValue !== null) {
      // Convert 'true'/'false' string to actual boolean for API
      const boolValue = isPublishedValue.toLowerCase() === 'true';
      // Send boolean value directly to the backend, not as an array
      filterParams.isPublished = boolValue;
      console.log(`Setting isPublished filter to boolean: ${boolValue}`);
    }
    
    // Log the parsed parameters
    console.log('Products API - Parsed parameters:', filterParams);
    
    // Build the admin API URL with the v1 prefix
    const queryString = new URLSearchParams();
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      
      // Map pageSize to limit for backend compatibility
      const paramKey = key === 'pageSize' ? 'limit' : key;
      
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item !== undefined && item !== null) {
            // For category filters, use the correct parameter format
            if (key === 'categories') {
              if (value.length === 1) {
                queryString.append('categoryId', item.toString());
              } else {
                queryString.append('categoryIds[]', item.toString());
              }
            } else {
              queryString.append(`${paramKey}[]`, item.toString());
            }
          }
        });
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue !== undefined && subValue !== null) {
            queryString.append(`${paramKey}.${subKey}`, subValue.toString());
          }
        });
      } else {
        // Handle categoryId and categoryIds specially
        if (key === 'categoryId' || key === 'categoryIds') {
          console.log(`Adding ${key} parameter: ${value}`);
        }
        queryString.append(paramKey, value.toString());
      }
    });
    
    // Use the v1 admin endpoint
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products?${queryString.toString()}`;
    console.log('Making admin products request to:', url);
    
    const response = await makeRequest(url, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle token expiration
      if (response.status === 401 && (
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('invalid token')
      )) {
        return NextResponse.json(
          { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to fetch products',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }
    
    // Parse the API response
    const apiData = await response.json();
    
    // Log the response data structure
    console.log('Products API Response - Structure:', {
      keys: Object.keys(apiData),
      dataItemsCount: apiData.data?.length,
      metaInfo: apiData.meta
    });
    
    // Transform the backend response format (data/meta) to the admin panel format (products/pagination)
    const transformedData = {
      products: Array.isArray(apiData.data) ? apiData.data : [],
      pagination: {
        total: apiData.meta?.total || 0,
        totalPages: apiData.meta?.totalPages || 0,
        currentPage: apiData.meta?.page || 1,
        pageSize: apiData.meta?.limit || 10,
        hasMore: apiData.meta?.hasNextPage || false,
        hasPrevious: apiData.meta?.hasPrevPage || false
      }
    };
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error in products API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const productData = await request.json();
    
    // Validate required fields
    if (!productData.name || !productData.price) {
      return NextResponse.json(
        { message: 'Name and price are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Handle categoryId as required by the backend
    if (productData.categoryId) {
      // Check if we're using the fallback category
      if (productData.categoryId === 'default-category') {
        console.log('Using fallback category ID');
        
        // Try to create a default category if needed
        try {
          const createCategoryResponse = await makeRequest(
            `${PRODUCT_SERVICE_URL}/api/v1/admin/categories`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: 'Default Category',
                description: 'Automatically created default category'
              }),
            }
          );
          
          if (createCategoryResponse.ok) {
            const categoryData = await createCategoryResponse.json();
            productData.categoryId = categoryData.id;
            console.log('Created default category with ID:', categoryData.id);
          }
        } catch (error) {
          console.error('Failed to create default category:', error);
          // Continue with the fallback ID
        }
      } else {
        console.log('Using provided categoryId:', productData.categoryId);
      }
    } else {
      return NextResponse.json(
        { message: 'Category is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    
    // Handle variants for SKU and stock
    if (productData.sku || productData.stock !== undefined) {
      // Create a variant from SKU and stock
      const variant = {
        name: 'Default',
        sku: productData.sku || `SKU-${Date.now()}`,
        price: productData.price || 0,
        stock: productData.stock || 0
      };
      
      // Add variant to the product data
      productData.variants = [variant];
      console.log('Created variant from SKU and stock:', variant);
    }
    
    // Ensure boolean fields are properly included
    if (productData.isFeatured !== undefined) {
      console.log('Setting isFeatured to:', productData.isFeatured);
    }
    
    if (productData.isPublished !== undefined) {
      console.log('Setting isPublished to:', productData.isPublished);
    }

    // Use the admin endpoint for creating products
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products`;
    console.log('Creating product with URL:', url);
    
    // Validate brandId before sending to API
    if (productData.brandId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productData.brandId)) {
      console.log(`Invalid brandId format: "${productData.brandId}" - removing from request`);
      delete productData.brandId;
    }
    
    // Process date fields - remove them if they're null or invalid
    prepareDateFields(productData);
    
    // Validate image URL if provided
    if (productData.image) {
      // Check if it's a valid image URL
      const isValidImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(productData.image) || 
                            /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg))/i.test(productData.image) ||
                            /^\/storage\/products\/.+$/i.test(productData.image);
      
      if (!isValidImageUrl) {
        console.log(`Invalid image URL detected: ${productData.image} - removing from request`);
        delete productData.image;
      }
    }
    
    // Ensure seoMetadata is always an object
    if (!productData.seoMetadata || typeof productData.seoMetadata !== 'object') {
      productData.seoMetadata = {
        title: '',
        description: '',
        keywords: [],
        ogImage: ''
      };
    } else {
      // Clean up ogImage if it's not a valid image URL or if it's null
      if (productData.seoMetadata.ogImage === null || productData.seoMetadata.ogImage === undefined || productData.seoMetadata.ogImage.trim() === '') {
        productData.seoMetadata.ogImage = '';
      } else if (productData.seoMetadata.ogImage) {
        // Check if it's a valid image URL (should end with an image extension or be a valid image URL)
        const isValidImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(productData.seoMetadata.ogImage) || 
                               /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg))/i.test(productData.seoMetadata.ogImage);
        
        if (!isValidImageUrl) {
          console.log(`Invalid image URL detected: ${productData.seoMetadata.ogImage} - removing from request`);
          productData.seoMetadata.ogImage = '';
        }
      }
    }
    
    console.log('Complete product data for API:', JSON.stringify(productData, null, 2));
    
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle token expiration
      if (response.status === 401 && (
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('invalid token')
      )) {
        return NextResponse.json(
          { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to create product',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    // Extract the product data from the nested 'data' property if it exists
    const productResponse = responseData.data || responseData;
    
    return NextResponse.json(productResponse, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json(
        { message: 'Product ID and status are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Use the admin endpoint for updating product status
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${id}/status`;
    console.log(`Updating product ${id} status to ${status} with URL:`, url);
    
    const response = await makeRequest(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle token expiration
      if (response.status === 401 && (
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('invalid token')
      )) {
        return NextResponse.json(
          { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Product not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to update product status',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating product status:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get the product ID from the URL
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { message: 'Product ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const productData = await request.json();
    
    // Validate required fields
    if (!productData.name) {
      return NextResponse.json(
        { message: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Handle categoryId as required by the backend
    if (productData.categoryId) {
      // Check if we're using the fallback category
      if (productData.categoryId === 'default-category') {
        console.log('Using fallback category ID for update');
        
        // Try to create a default category if needed
        try {
          const createCategoryResponse = await makeRequest(
            `${PRODUCT_SERVICE_URL}/api/v1/admin/categories`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: 'Default Category',
                description: 'Automatically created default category'
              }),
            }
          );
          
          if (createCategoryResponse.ok) {
            const categoryData = await createCategoryResponse.json();
            productData.categoryId = categoryData.id;
            console.log('Created default category with ID:', categoryData.id);
          }
        } catch (error) {
          console.error('Failed to create default category:', error);
          // Continue with the fallback ID
        }
      } else {
        console.log('Using provided categoryId for update:', productData.categoryId);
      }
    } else {
      console.log('No categoryId provided for update');
    }

    // Use the admin endpoint for updating products
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${productId}`;
    console.log('Updating product with URL:', url);
    
    // Validate brandId before sending to API
    if (productData.brandId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productData.brandId)) {
      console.log(`Invalid brandId format: "${productData.brandId}" - removing from request`);
      delete productData.brandId;
    }
    
    // Process date fields - remove them if they're null or invalid
    prepareDateFields(productData);
    
    // Ensure seoMetadata is always an object
    if (!productData.seoMetadata || typeof productData.seoMetadata !== 'object') {
      productData.seoMetadata = {
        title: '',
        description: '',
        keywords: [],
        ogImage: ''
      };
    } else {
      // Clean up ogImage if it's not a valid image URL or if it's null
      if (productData.seoMetadata.ogImage === null || productData.seoMetadata.ogImage === undefined || productData.seoMetadata.ogImage.trim() === '') {
        productData.seoMetadata.ogImage = '';
      } else if (productData.seoMetadata.ogImage) {
        // Check if it's a valid image URL (should end with an image extension or be a valid image URL)
        const isValidImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(productData.seoMetadata.ogImage) || 
                               /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg))/i.test(productData.seoMetadata.ogImage);
        
        if (!isValidImageUrl) {
          console.log(`Invalid image URL detected: ${productData.seoMetadata.ogImage} - removing from request`);
          productData.seoMetadata.ogImage = '';
        }
      }
    }
    
    console.log('Product data:', productData);
    
    const response = await makeRequest(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle token expiration
      if (response.status === 401 && (
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('invalid token')
      )) {
        return NextResponse.json(
          { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Product not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to update product',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    // Extract the product data from the nested 'data' property if it exists
    const productResponse = responseData.data || responseData;
    
    return NextResponse.json(productResponse);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 