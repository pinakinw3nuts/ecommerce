import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Send the file to the product service
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);

    console.log('Uploading brand logo to product service...');
    
    const response = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/admin/brands/upload-image`, {
      method: 'POST',
      body: formDataToSend,
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error uploading brand logo to product service:', error);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: response.status });
    }

    const data = await response.json();
    console.log('Brand logo uploaded successfully:', data);
    
    return NextResponse.json({ imageUrl: data.imageUrl });
    
  } catch (error: any) {
    console.error('Error handling brand logo upload:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 