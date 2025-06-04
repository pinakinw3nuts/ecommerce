import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Respond with an SVG placeholder image
  return new NextResponse(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#f0f0f0" />
      <text x="50%" y="50%" font-family="sans-serif" font-size="24" text-anchor="middle" fill="#999">
        Image Placeholder
      </text>
    </svg>`,
    {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    }
  );
} 