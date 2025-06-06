import { NextRequest, NextResponse } from 'next/server';

// Redirect to the new standard route
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/api/v1/user/me', req.url));
}

export async function PUT(req: NextRequest) {
  return NextResponse.redirect(new URL('/api/v1/user/me', req.url), { status: 307 });
}

export async function PATCH(req: NextRequest) {
  return NextResponse.redirect(new URL('/api/v1/user/me', req.url), { status: 307 });
} 