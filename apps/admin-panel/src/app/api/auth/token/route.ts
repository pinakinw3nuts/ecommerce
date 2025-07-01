import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // This route is no longer needed as we're accessing cookies directly in API routes
  return NextResponse.json({ 
    message: 'This endpoint is deprecated. API routes now access auth tokens directly from cookies.' 
  });
} 