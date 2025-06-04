import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      blocks: [
        { 
          type: "banner", 
          content: { 
            imageUrl: "/api/placeholder?width=1200&height=400", 
            alt: "Welcome to our store" 
          } 
        },
        { 
          type: "text", 
          content: { 
            text: "Shop the best products here. We offer quality items at affordable prices." 
          } 
        }
      ]
    });
  } catch (error) {
    console.error('Error in CMS home API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch CMS data' },
      { status: 500 }
    );
  }
} 