import { NextRequest, NextResponse } from 'next/server';

// Mock users data with more realistic information
const mockUsers = Array.from({ length: 100 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `${['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'James', 'Lisa'][Math.floor(Math.random() * 8)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][Math.floor(Math.random() * 8)]}`,
  email: `user${i + 1}@example.com`,
  role: i === 0 ? 'admin' : i < 5 ? 'moderator' : 'user',
  status: i % 10 === 0 ? 'banned' : 'active',
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  lastLogin: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
  phoneNumber: `+1${Math.floor(Math.random() * 1000000000)}`,
  isEmailVerified: Math.random() > 0.2,
  country: ['US', 'UK', 'CA', 'AU', 'FR', 'DE'][Math.floor(Math.random() * 6)],
}));

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get query params
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const search = searchParams.get('search') || '';
    const roles = searchParams.get('roles')?.split(',').filter(Boolean) || [];
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const country = searchParams.get('country');

    // Filter users
    let filteredUsers = [...mockUsers];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phoneNumber.includes(search)
      );
    }

    // Apply role filter
    if (roles.length > 0) {
      filteredUsers = filteredUsers.filter(user => roles.includes(user.role));
    }

    // Apply status filter
    if (statuses.length > 0) {
      filteredUsers = filteredUsers.filter(user => statuses.includes(user.status));
    }

    // Apply country filter
    if (country) {
      filteredUsers = filteredUsers.filter(user => user.country === country);
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
      const toDate = dateTo ? new Date(dateTo) : new Date();
      
      filteredUsers = filteredUsers.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= fromDate && userDate <= toDate;
      });
    }

    // Apply sorting
    filteredUsers.sort((a: any, b: any) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (bValue > aValue ? 1 : -1);
    });

    // Calculate pagination
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = filteredUsers.slice(start, end);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        pageSize,
        hasMore: page < totalPages,
        hasPrevious: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    
    // In a real app, you would update the user in your database
    // For now, we'll just return a success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.name || !userData.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Create new user with mock data
    const newUser = {
      id: `user-${mockUsers.length + 1}`,
      ...userData,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      status: 'active',
      role: 'user',
      isEmailVerified: false,
      country: userData.country || 'US',
      phoneNumber: userData.phoneNumber || null,
    };

    // In a real app, you would save to database here
    mockUsers.push(newUser);

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 