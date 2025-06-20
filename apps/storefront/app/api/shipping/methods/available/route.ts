import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { SHIPPING_API_URL } from '@/lib/constants';

// Helper function to retry requests with backoff
const fetchWithRetry = async (url: string, config: any, retries = 3, backoff = 300) => {
  try {
    return await axios.get(url, config);
  } catch (error: any) {
    if (retries === 0) throw error;
    
    // If error is related to connection refused, retry with IPv4 explicitly
    if (error.message && error.message.includes('ECONNREFUSED')) {
      // Replace any localhost with 127.0.0.1
      const ipv4Url = url.replace('localhost', '127.0.0.1');
      console.log(`Retrying with IPv4 address: ${ipv4Url}`);
      
      // Wait for backoff period
      await new Promise(resolve => setTimeout(resolve, backoff));
      
      // Retry with exponential backoff
      return fetchWithRetry(ipv4Url, config, retries - 1, backoff * 2);
    }
    
    throw error;
  }
};

export async function GET(request: NextRequest) {
  // Get pincode from query string
  const searchParams = new URL(request.url).searchParams;
  const pincode = searchParams.get('pincode');
  
  if (!pincode) {
    return NextResponse.json(
      { error: 'Missing required parameter: pincode' },
      { status: 400 }
    );
  }
  
  try {
    // Get authorization header to pass through to the shipping service
    const authHeader = request.headers.get('Authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Ensure we're using IPv4 address
    let apiUrl = `${SHIPPING_API_URL}/shipping/methods/available?pincode=${pincode}`;
    if (apiUrl.includes('localhost')) {
      apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }
    
    console.log('Calling shipping API URL:', apiUrl);
    
    // Forward request to shipping service
    const response = await axios.get(apiUrl, { headers });
    
    // Return the response from the shipping service
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching shipping methods:', error.message);
    
    // Return default shipping methods on error
    return NextResponse.json([
      {
        id: 'standard',
        code: 'standard',
        name: 'Standard Shipping',
        description: 'Delivery in 3-5 business days',
        baseRate: 500,
        estimatedDays: 4
      },
      {
        id: 'express',
        code: 'express',
        name: 'Express Shipping',
        description: 'Delivery in 1-2 business days',
        baseRate: 1000,
        estimatedDays: 2
      }
    ]);
  }
} 