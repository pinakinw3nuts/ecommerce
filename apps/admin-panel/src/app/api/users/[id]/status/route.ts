import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const userId = context.params.id;
    const { status } = await request.json();

    // In a real app, you would update the user in your database
    // For now, we'll just return a success response
    return NextResponse.json({ 
      success: true,
      message: `User ${status === 'banned' ? 'banned' : 'unbanned'} successfully`
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 