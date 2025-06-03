import { NextRequest, NextResponse } from 'next/server';

// Import the mockAddresses from the parent route
// In a real implementation, this would be a database query
import { mockAddresses } from '../route';

// Helper function to extract id safely
async function extractId(params: any): Promise<string> {
  // In Next.js 14, params might be a Promise
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  return resolvedParams?.id || '';
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For demo purposes, we'll skip authentication
    // In a real implementation, we would verify the JWT token

    // Extract id safely
    const id = await extractId(params);
    
    // Find the address to update
    const addressIndex = mockAddresses.findIndex(addr => addr.id === id);
    
    if (addressIndex === -1) {
      return new NextResponse('Address not found', { status: 404 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['type', 'name', 'phone', 'line1', 'city', 'state', 'country', 'pincode'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return new NextResponse(`${field} is required`, { status: 400 });
      }
    }
    
    // Update the address
    const updatedAddress = {
      ...mockAddresses[addressIndex],
      type: body.type,
      name: body.name,
      phone: body.phone,
      line1: body.line1,
      city: body.city,
      state: body.state,
      country: body.country,
      pincode: body.pincode
    };
    
    // In a real implementation, we would update this in a database
    mockAddresses[addressIndex] = updatedAddress;
    
    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    return new NextResponse('Failed to update address', { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For demo purposes, we'll skip authentication
    // In a real implementation, we would verify the JWT token

    // Extract id safely
    const id = await extractId(params);
    
    // Find the address to delete
    const addressIndex = mockAddresses.findIndex(addr => addr.id === id);
    
    if (addressIndex === -1) {
      return new NextResponse('Address not found', { status: 404 });
    }
    
    // In a real implementation, we would delete this from a database
    const index = mockAddresses.findIndex(addr => addr.id === id);
    if (index !== -1) {
      mockAddresses.splice(index, 1);
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting address:', error);
    return new NextResponse('Failed to delete address', { status: 500 });
  }
} 