import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

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

    const data = await request.json();
    const { brandIds, isActive } = data;

    if (!brandIds || !Array.isArray(brandIds) || brandIds.length === 0) {
      return NextResponse.json(
        { message: 'Brand IDs are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { message: 'isActive must be a boolean', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    console.log(`Updating status for ${brandIds.length} brands to isActive=${isActive}`);

    // Make a request to the backend API
    const response = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/admin/brands/bulk-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`,
      },
      body: JSON.stringify({ brandIds, isActive }),
    });

    // Check if the backend supports bulk status update
    if (response.status === 404) {
      console.log('Bulk status endpoint not found, falling back to individual updates');
      
      // If bulk endpoint doesn't exist, update brands individually
      const updatePromises = brandIds.map(async (brandId) => {
        try {
          // First, get the current brand data
          const getResponse = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/brands/${brandId}`, {
            headers: {
              'Authorization': `Bearer ${token.value}`,
            },
          });
          
          if (!getResponse.ok) {
            console.error(`Failed to fetch brand ${brandId}:`, getResponse.status);
            return { id: brandId, success: false };
          }
          
          const brandData = await getResponse.json();
          
          // Update the brand with the new status
          const updateResponse = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/brands/${brandId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.value}`,
            },
            body: JSON.stringify({
              ...brandData,
              isActive
            }),
          });
          
          if (!updateResponse.ok) {
            console.error(`Failed to update brand ${brandId}:`, updateResponse.status);
            return { id: brandId, success: false };
          }
          
          return { id: brandId, success: true };
        } catch (error) {
          console.error(`Error updating brand ${brandId}:`, error);
          return { id: brandId, success: false };
        }
      });
      
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.success).length;
      
      return NextResponse.json({
        message: `Updated ${successCount} of ${brandIds.length} brands`,
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
        { message: errorData?.message || 'Failed to update brands status', code: errorData?.code || 'API_ERROR' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error updating brands status:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 