import { NextRequest, NextResponse } from 'next/server';

// Mock users data
const mockUsers = Array.from({ length: 50 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i === 0 ? 'admin' : i < 5 ? 'moderator' : 'user',
  status: i % 10 === 0 ? 'banned' : 'active',
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
}));

export async function GET(request: NextRequest) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Get page from query params
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = 10;

  // Calculate pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedUsers = mockUsers.slice(start, end);

  return NextResponse.json({
    users: paginatedUsers,
    total: mockUsers.length,
  });
}

export async function PATCH(request: NextRequest) {
  const { id, status } = await request.json();
  
  // In a real app, you would update the user in your database
  // For now, we'll just return a success response
  return NextResponse.json({ success: true });
} 