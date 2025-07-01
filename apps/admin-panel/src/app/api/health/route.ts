import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

// Payment service URL with fallback to localhost
const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:3007';

export async function GET() {
  try {
    // Check if payment service is reachable
    let paymentServiceStatus = 'unknown';
    try {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/health`, { 
        method: 'GET',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      });
      
      paymentServiceStatus = response.ok ? 'online' : `error (${response.status})`;
    } catch (error) {
      console.error('Failed to connect to payment service:', error);
      paymentServiceStatus = 'offline';
    }

    // Return health check information
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        payment: {
          url: PAYMENT_SERVICE_URL,
          status: paymentServiceStatus
        }
      },
      config: {
        api_base_url: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
        payment_service_url: PAYMENT_SERVICE_URL
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 