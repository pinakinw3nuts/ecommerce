import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Construct the path from the path segments
    const pathSegments = params.path;
    const imagePath = pathSegments.join('/');
    
    // Log the request details
    console.log(`Fetching image from product service: ${imagePath}`);
    
    // Fetch the image from the product service
    const imageUrl = `${PRODUCT_SERVICE_URL}/public/${imagePath}`;
    console.log(`Full image URL: ${imageUrl}`);
    
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return new NextResponse(null, { status: response.status });
    }
    
    // Get the image data as a buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Return the image with the appropriate content type
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      }
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return new NextResponse(null, { status: 500 });
  }
} 