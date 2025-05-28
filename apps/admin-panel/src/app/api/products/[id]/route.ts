import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { makeRequest, prepareDateFields } from '../../../../lib/make-request';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const productId = params.id;
    console.log(`Fetching product with ID: ${productId}`);

    // Use the admin endpoint for fetching products
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${productId}`;
    console.log('Full request URL:', url);
    
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

      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Product not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to fetch product',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Log raw data for debugging
    console.log('Raw product data from API:', data);
    
    // Check for variant data
    if (data.variants && data.variants.length > 0) {
      console.log('First variant from API:', data.variants[0]);
    } else {
      console.log('No variants found in API response');
    }
    
    // Process the data to ensure all necessary fields are present
    const processedData = {
      ...data,
      // Provide default values for all required fields
      id: data.id,
      name: data.name || 'Unnamed Product',
      description: data.description || '',
      price: typeof data.price === 'number' ? data.price : 0,
      slug: data.slug || '',
      mediaUrl: data.mediaUrl || null,
      image: data.mediaUrl || data.image || null,
      
      // Extract variant information if available, or use defaults
      sku: data.variants && data.variants.length > 0 
        ? data.variants[0].sku 
        : (data.sku || `SKU-${Date.now()}`),
      
      stock: data.variants && data.variants.length > 0 
        ? (typeof data.variants[0].stock === 'number' ? data.variants[0].stock : 0)
        : (typeof data.stock === 'number' ? data.stock : 0),
      
      // Add category information, either from object or ID
      categoryId: data.categoryId || 
        (data.category && typeof data.category === 'object' ? data.category.id : ''),
      
      // Add brand ID
      brandId: data.brandId || 
        (data.brand && typeof data.brand === 'object' ? data.brand.id : ''),
      
      // Add tag IDs
      tagIds: data.tagIds || 
        (data.tags && Array.isArray(data.tags) ? data.tags.map((tag: any) => tag.id) : []),
      
      // Set default values for booleans
      isFeatured: typeof data.isFeatured === 'boolean' ? data.isFeatured : false,
      isPublished: typeof data.isPublished === 'boolean' ? data.isPublished : false,
      
      // Ensure variants array exists
      variants: Array.isArray(data.variants) ? data.variants : [],
      
      // Ensure we have category data
      category: data.category || { id: '', name: 'Uncategorized' }
    };
    
    console.log('Processed product data:', processedData);
    return NextResponse.json(processedData);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const productId = params.id;
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

    // Handle variants for SKU and stock
    if (productData.sku !== undefined || productData.stock !== undefined) {
      // Determine if we need to create a new variant or update existing ones
      let variants = [];
      
      // If the product already has variants, try to update the first one
      if (Array.isArray(productData.variants) && productData.variants.length > 0) {
        // Update existing variant with new data
        variants = productData.variants.map((variant: any, index: number) => {
          if (index === 0) {
            return {
              ...variant,
              sku: productData.sku !== undefined ? productData.sku : variant.sku,
              stock: productData.stock !== undefined ? productData.stock : variant.stock,
              price: productData.price !== undefined ? productData.price : variant.price,
            };
          }
          return variant;
        });
      } else {
        // Create a new variant
        const variant = {
          name: 'Default',
          sku: productData.sku || `SKU-${Date.now()}`,
          price: productData.price || 0,
          stock: productData.stock !== undefined ? productData.stock : 0
        };
        variants = [variant];
      }
      
      // Add variants to the product data
      productData.variants = variants;
      console.log('Updated variants:', variants);
    } else if (!Array.isArray(productData.variants) || productData.variants.length === 0) {
      // If no SKU/stock provided and no variants exist, create a default variant
      const variant = {
        name: 'Default',
        sku: `SKU-${Date.now()}`,
        price: productData.price || 0,
        stock: 0
      };
      productData.variants = [variant];
      console.log('Created default variant:', variant);
    }

    // Validate brandId before sending to API
    if (productData.brandId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productData.brandId)) {
      console.log(`Invalid brandId format: "${productData.brandId}" - removing from request`);
      delete productData.brandId;
    }
    
    // Process date fields - remove them if they're null or invalid
    prepareDateFields(productData);
    
    // Format data for API - include all fields that the API expects
    const apiProductData = {
      name: productData.name,
      description: productData.description || '',
      price: productData.price || 0,
      categoryId: productData.categoryId || '',
      variants: productData.variants || [],
      isFeatured: productData.isFeatured || false,
      isPublished: productData.isPublished || false,
      // Add all the missing fields with validation
      salePrice: productData.salePrice,
      stockQuantity: productData.stockQuantity,
      isInStock: productData.isInStock,
      specifications: productData.specifications,
      keywords: productData.keywords,
      // Ensure seoMetadata is always an object
      seoMetadata: productData.seoMetadata || {
        title: '',
        description: '',
        keywords: [],
        ogImage: ''
      },
      // Clean up ogImage if it's not a valid image URL
      ...(productData.seoMetadata && {
        seoMetadata: {
          ...productData.seoMetadata,
          ogImage: (() => {
            if (productData.seoMetadata.ogImage === null || productData.seoMetadata.ogImage === undefined || productData.seoMetadata.ogImage.trim() === '') return '';
            
            // Check if it's a valid image URL (should end with an image extension or be a valid image URL)
            const isValidImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(productData.seoMetadata.ogImage) || 
                                   /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg))/i.test(productData.seoMetadata.ogImage);
            
            if (!isValidImageUrl) {
              console.log(`Invalid image URL detected: ${productData.seoMetadata.ogImage} - removing from request`);
              return '';
            }
            
            return productData.seoMetadata.ogImage;
          })()
        }
      }),
      // Only include brandId if it's a valid UUID
      ...(productData.brandId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productData.brandId) 
        ? { brandId: productData.brandId } 
        : {}),
      tagIds: productData.tagIds,
    };

    // Only add date fields if they are valid dates
    if (productData.saleStartDate) {
      apiProductData.saleStartDate = productData.saleStartDate;
    }
    
    if (productData.saleEndDate) {
      apiProductData.saleEndDate = productData.saleEndDate;
    }

    // Log complete data being sent to API
    console.log('Complete product data for API:', JSON.stringify(apiProductData, null, 2));

    // Use the admin endpoint for updating products
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${productId}`;
    console.log('Updating product with URL:', url);
    console.log('Product data for API:', apiProductData);
    
    const response = await makeRequest(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
      body: JSON.stringify(apiProductData),
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

    const data = await response.json();
    return NextResponse.json(data);
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

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const productId = params.id;
    console.log(`Deleting product with ID: ${productId}`);

    // Use the admin endpoint for deleting products
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${productId}`;
    
    const response = await makeRequest(url, {
      method: 'DELETE',
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

      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Product not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: errorData?.message || 'Failed to delete product',
          code: errorData?.code || 'API_ERROR'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 