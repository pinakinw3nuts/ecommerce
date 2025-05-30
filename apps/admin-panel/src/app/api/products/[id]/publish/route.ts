import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  
  // In a real app, you would update the product in your database
  // For now, we'll just simulate a successful update
  await new Promise(resolve => setTimeout(resolve, 300));

  return NextResponse.json({ success: true });
} 