import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Create a simple SVG as a placeholder
  const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#eeeeee"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999999" text-anchor="middle" dominant-baseline="middle">Image Not Available</text>
  </svg>`;
  
  // Convert SVG to buffer
  const buffer = Buffer.from(svg);
  
  // Return the SVG as an image
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
} 