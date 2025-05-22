import { NextRequest, NextResponse } from 'next/server';

// Mock users data (same as in the main users route)
const mockUsers = Array.from({ length: 50 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i === 0 ? 'admin' : i < 5 ? 'moderator' : 'user',
  status: i % 10 === 0 ? 'banned' : 'active',
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
}));

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();

    // Get users to export
    const usersToExport = userIds === 'all' 
      ? mockUsers 
      : mockUsers.filter(user => userIds.includes(user.id));

    // Convert users to CSV
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At'];
    const rows = usersToExport.map(user => [
      user.id,
      user.name,
      user.email,
      user.role,
      user.status,
      user.createdAt
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=users.csv'
      }
    });
  } catch (error) {
    console.error('Error in export users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 