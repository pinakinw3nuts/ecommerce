import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const userId = context.params.id;

    // In a real app, you would:
    // 1. Get the user's email from the database
    // 2. Send the email using your email service
    // 3. Log the email send attempt
    // For now, we'll just return a success response
    return NextResponse.json({ 
      success: true,
      message: `Email sent to user ${userId} successfully`
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 