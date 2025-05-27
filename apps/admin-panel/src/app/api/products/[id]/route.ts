import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { makeRequest } from '../../../../lib/make-request';

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
    return NextResponse.json(data);
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

    // Use the admin endpoint for updating products
    const url = `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${productId}`;
    console.log('Updating product with URL:', url);
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