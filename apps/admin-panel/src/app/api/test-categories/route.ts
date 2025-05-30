import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Use IPv4 explicitly to avoid IPv6 issues
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3003';

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
    
    // Extract category filter parameters
    const categoryId = searchParams.get('categoryId');
    const categoryIds = searchParams.get('categoryIds');
    
    // Log the raw parameters
    console.log('Category filter test - Raw parameters:', {
      categoryId,
      categoryIds,
      url: request.url,
      allParams: Object.fromEntries(searchParams.entries())
    });
    
    // Build the test URL - try both approaches
    
    // Approach 1: Send categoryId directly
    let url1 = `${PRODUCT_SERVICE_URL}/api/v1/admin/products?limit=5`;
    if (categoryId) {
      url1 += `&categoryId=${encodeURIComponent(categoryId)}`;
    } else if (categoryIds) {
      url1 += `&categoryIds=${encodeURIComponent(categoryIds)}`;
    }
    
    // Approach 2: Try using categoryId[] array format
    let url2 = `${PRODUCT_SERVICE_URL}/api/v1/admin/products?limit=5`;
    if (categoryId) {
      url2 += `&categoryId[]=${encodeURIComponent(categoryId)}`;
    } else if (categoryIds) {
      const idArray = categoryIds.split(',');
      idArray.forEach(id => {
        url2 += `&categoryIds[]=${encodeURIComponent(id.trim())}`;
      });
    }
    
    console.log('Testing category filters with URLs:', { url1, url2 });
    
    // Make the first request
    const response1 = await fetch(url1, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Make the second request
    const response2 = await fetch(url2, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Process the responses
    const data1 = await response1.json();
    const data2 = await response2.json();
    
    // Return the test results
    return NextResponse.json({
      originalParams: {
        categoryId,
        categoryIds,
        allParams: Object.fromEntries(searchParams.entries())
      },
      approach1: {
        url: url1,
        success: response1.ok,
        status: response1.status,
        productCount: data1.data?.length || 0,
        firstProduct: data1.data?.[0]?.name || null,
        categoryNames: data1.data?.map((p: any) => p.category?.name) || []
      },
      approach2: {
        url: url2,
        success: response2.ok,
        status: response2.status,
        productCount: data2.data?.length || 0,
        firstProduct: data2.data?.[0]?.name || null,
        categoryNames: data2.data?.map((p: any) => p.category?.name) || []
      }
    });
  } catch (error) {
    console.error('Test category filter error:', error);
    return NextResponse.json(
      { 
        message: 'Test failed', 
        error: (error as Error).message,
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
} 