import { NextResponse } from 'next/server';
import { PRODUCT_SERVICE_URL } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    const apiUrl = new URL('/api/v1/coupons/', PRODUCT_SERVICE_URL);
    
    console.log(`Testing direct connection to product service: ${apiUrl.toString()}`);
    
    try {
      // Try a direct fetch to the product service
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Product service response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error from product service: ${response.status}`, errorText);
        
        return NextResponse.json({
          success: false,
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: apiUrl.toString()
        });
      }
      
      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        status: response.status,
        url: apiUrl.toString(),
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : (data.coupons ? data.coupons.length : 'unknown'),
        sample: Array.isArray(data) ? (data.length > 0 ? data[0] : null) : (data.coupons && data.coupons.length > 0 ? data.coupons[0] : null)
      });
    } catch (fetchError) {
      console.error('Error connecting to product service:', fetchError);
      
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      const errorName = fetchError instanceof Error ? fetchError.name : 'UnknownError';
      const errorStack = fetchError instanceof Error ? fetchError.stack : undefined;
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        url: apiUrl.toString(),
        errorType: errorName,
        errorStack: errorStack
      });
    }
  } catch (error) {
    console.error('Error in test API route:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 