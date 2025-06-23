import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ORDER_API_URL } from '@/lib/constants';
import { mapOrderFromApi } from '../../route';
import { jwtDecode } from 'jwt-decode';

// Force dynamic execution mode
export const dynamic = 'force-dynamic';

// Helper function to get IPv4 URL
function getIpv4Url(url: string): string {
  // Replace localhost with 127.0.0.1 to force IPv4
  return url.replace('localhost', '127.0.0.1');
}

// Helper function to extract user ID from JWT token
function extractUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<{ sub: string; userId: string; id: string }>(token);
    // Log the decoded token for debugging
    console.log('Decoded token:', JSON.stringify(decoded, null, 2));
    return decoded.userId || decoded.sub || decoded.id || null;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Process the order cancellation request
export async function POST(req: NextRequest, contextObj: { params: { id: string } }) {
  // We get the id from the URL path to avoid using params.id directly
  const path = req.nextUrl.pathname;
  const segments = path.split('/');
  const orderId = segments[segments.length - 2]; // The ID is the second-to-last segment
  
  try {
    const token = req.cookies.get('accessToken')?.value;
    
    if (!token) {
      console.error('No access token found in cookies');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Extract user ID from token
    const userId = extractUserIdFromToken(token);
    if (!userId) {
      console.error('Failed to extract user ID from token');
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Extract reason from request body
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'No reason provided';
    
    console.log(`Attempting to cancel order ${orderId} for user ${userId} with reason: ${reason}`);
    console.log(`Using token: ${token.substring(0, 10)}...`);
    
    // Try multiple endpoints in sequence, with explicit IPv4 addresses
    const orderApiUrl = ORDER_API_URL.replace('localhost', '127.0.0.1');
    const endpoints = [
      `${orderApiUrl}/orders/${orderId}/cancel`,
      `${orderApiUrl}/public/orders/${orderId}/cancel`
    ];
    
    let response = null;
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        // Call the order service API through the API gateway to cancel the order
        const result = await axios.post(
          endpoint,
          { 
            reason, // Include the reason in the request body
            userId, // Explicitly include the userId for the createdBy field
            createdBy: userId, // Alternative field name that might be used
            user: { id: userId }, // Some APIs expect a user object
            cancelledBy: userId // Another possible field name
          }, 
          {
            headers: {
              'Authorization': `Bearer ${token}`, // Ensure 'Bearer ' prefix is included
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-User-ID': userId // Add user ID as a header as well
            },
            timeout: 10000 // 10 second timeout
          }
        );
        
        response = result;
        console.log(`Cancel order response status: ${result.status}`);
        break;
      } catch (err: any) {
        lastError = err;
        console.error(`Failed to cancel order at ${endpoint}:`, err.message);
        console.error('Error details:', {
          status: err.response?.status,
          data: err.response?.data
        });
        
        // Enhanced error logging
        if (err.response) {
          console.error('Full error response:', JSON.stringify({
            status: err.response.status,
            statusText: err.response.statusText,
            headers: err.response.headers,
            data: err.response.data
          }, null, 2));
        } else if (err.request) {
          console.error('Request was made but no response was received', err.request);
        } else {
          console.error('Error setting up request:', err.message);
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error('Failed to cancel order at all endpoints');
    }
    
    // Map the response to match our frontend expected format
    const order = mapOrderFromApi(response.data);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return NextResponse.json(
      { error: 'Failed to cancel order', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 