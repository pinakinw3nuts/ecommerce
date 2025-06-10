import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    if (!file) {
      console.error('No file provided in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File information:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Send the file to the product service
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);

    // If productId is provided, use the specific product endpoint
    const uploadUrl = productId 
      ? `${PRODUCT_SERVICE_URL}/api/v1/admin/products/${productId}/image` 
      : `${PRODUCT_SERVICE_URL}/api/v1/admin/products/upload-image`;
    
    console.log(`Uploading product image to ${uploadUrl}`);
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });

      console.log(`Upload response status: ${response.status}`);
      
      const responseText = await response.text();
      console.log(`Raw upload response: ${responseText}`);
      
      if (!response.ok) {
        console.error(`Error uploading product image to product service: ${responseText}`);
        return NextResponse.json({ 
          error: `Failed to upload image: ${responseText}` 
        }, { status: response.status });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        return NextResponse.json({ 
          error: 'Invalid response from product service' 
        }, { status: 500 });
      }
      
      if (!data.imageUrl) {
        console.error('No imageUrl in response:', data);
        return NextResponse.json({ 
          error: 'Invalid response from product service: missing imageUrl' 
        }, { status: 500 });
      }
      
      console.log('Product image uploaded successfully:', data);
      return NextResponse.json({ imageUrl: data.imageUrl });
      
    } catch (fetchError: any) {
      console.error('Network error uploading image:', fetchError);
      return NextResponse.json({ 
        error: `Network error: ${fetchError.message}` 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Error handling product image upload:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 