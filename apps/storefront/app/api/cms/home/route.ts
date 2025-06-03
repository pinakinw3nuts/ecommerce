import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    blocks: [
      { 
        type: "banner", 
        content: { 
          imageUrl: "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?q=80&w=2070&auto=format&fit=crop", 
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
} 