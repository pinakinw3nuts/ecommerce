import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { tagIds, isActive } = data;

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { message: 'Tag IDs are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { message: 'isActive must be a boolean', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    console.log(`Updating status for ${tagIds.length} tags to isActive=${isActive}`);

    // Make a request to the backend API
    const response = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/admin/tags/bulk-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`,
      },
      body: JSON.stringify({ tagIds, isActive }),
    });

    // Check if the backend supports bulk status update
    if (response.status === 404) {
      console.log('Bulk status endpoint not found, falling back to individual updates');
      
      // If bulk endpoint doesn't exist, update tags individually
      const updatePromises = tagIds.map(async (tagId) => {
        try {
          // First, get the current tag data
          const getResponse = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/tags/${tagId}`, {
            headers: {
              'Authorization': `Bearer ${token.value}`,
            },
          });
          
          if (!getResponse.ok) {
            console.error(`Failed to fetch tag ${tagId}:`, getResponse.status);
            return { id: tagId, success: false };
          }
          
          const tagData = await getResponse.json();
          
          // Update the tag with the new status
          const updateResponse = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/admin/tags/${tagId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.value}`,
            },
            body: JSON.stringify({
              ...tagData,
              isActive
            }),
          });
          
          if (!updateResponse.ok) {
            console.error(`Failed to update tag ${tagId}:`, updateResponse.status);
            return { id: tagId, success: false };
          }
          
          return { id: tagId, success: true };
        } catch (error) {
          console.error(`Error updating tag ${tagId}:`, error);
          return { id: tagId, success: false };
        }
      });
      
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.success).length;
      
      return NextResponse.json({
        message: `Updated ${successCount} of ${tagIds.length} tags`,
        updatedCount: successCount,
        results
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      
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
        { message: errorData?.message || 'Failed to update tags status', code: errorData?.code || 'API_ERROR' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error updating tags status:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 