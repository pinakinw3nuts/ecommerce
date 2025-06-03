import { NextRequest, NextResponse } from 'next/server';

// Mock addresses data store
export let mockAddresses = [
  {
    id: "addr_1",
    type: "shipping",
    name: "John Doe",
    phone: "555-1234",
    line1: "123 Main St",
    city: "New York",
    state: "NY",
    country: "USA",
    pincode: "10001"
  },
  {
    id: "addr_2",
    type: "billing",
    name: "John Doe",
    phone: "555-1234",
    line1: "456 Business Ave",
    city: "New York",
    state: "NY",
    country: "USA",
    pincode: "10002"
  }
];

// Simple function to generate a unique ID
function generateId() {
  return `addr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function GET(req: NextRequest) {
  try {
    // For demo purposes, we'll skip authentication
    // In a real implementation, we would verify the JWT token
    
    // Return the mock addresses
    return NextResponse.json(mockAddresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return new NextResponse('Failed to fetch addresses', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // For demo purposes, we'll skip authentication
    // In a real implementation, we would verify the JWT token
    
    // Parse the request body
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['type', 'name', 'phone', 'line1', 'city', 'state', 'country', 'pincode'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return new NextResponse(`${field} is required`, { status: 400 });
      }
    }
    
    // Create new address with a unique ID
    const newAddress = {
      id: generateId(),
      type: body.type,
      name: body.name,
      phone: body.phone,
      line1: body.line1,
      city: body.city,
      state: body.state,
      country: body.country,
      pincode: body.pincode
    };
    
    // In a real implementation, we would save this to a database
    // For now, just add to our mock data
    mockAddresses.push(newAddress);
    
    return new NextResponse(JSON.stringify(newAddress), {
      status: 201,
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating address:', error);
    return new NextResponse('Failed to create address', { status: 500 });
  }
} 