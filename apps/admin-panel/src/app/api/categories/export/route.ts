import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { mockCategories } from '@/lib/mock/categories';
import type { Category } from '@/lib/mock/categories';

export async function POST(request: NextRequest) {
  try {
    console.log('Processing export request');
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const { categoryIds } = await request.json();
    console.log('Categories to export:', categoryIds);

    // Get categories to export
    let categoriesToExport = mockCategories;
    if (categoryIds !== 'all') {
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return NextResponse.json(
          { message: 'Invalid category IDs', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }
      categoriesToExport = mockCategories.filter((cat: Category) => categoryIds.includes(cat.id));
    }

    // Convert categories to CSV format
    const headers = ['ID', 'Name', 'Description', 'Slug', 'Status', 'Parent ID', 'Image URL', 'Created At', 'Updated At'];
    const rows = categoriesToExport.map((cat: Category) => [
      cat.id,
      cat.name,
      cat.description || '',
      cat.slug,
      cat.isActive ? 'Active' : 'Inactive',
      cat.parentId || '',
      cat.imageUrl || '',
      cat.createdAt,
      cat.updatedAt,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create and return the CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=categories.csv',
      },
    });

  } catch (error: any) {
    console.error('Error in export:', error);
    return NextResponse.json(
      {
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
      },
      { status: error.status || 500 }
    );
  }
} 