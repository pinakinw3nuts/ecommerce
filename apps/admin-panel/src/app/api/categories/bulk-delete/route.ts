import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { mockCategories } from '@/lib/mock/categories';
import type { Category } from '@/lib/mock/categories';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



export async function POST(request: NextRequest) {
  try {
    console.log('Processing bulk delete request');
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const { categoryIds } = await request.json();
    console.log('Categories to delete:', categoryIds);

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { message: 'No categories specified for deletion', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Check for categories with children
    const categoriesWithChildren = categoryIds.filter(id =>
      mockCategories.some((cat: Category) => cat.parentId === id)
    );

    if (categoriesWithChildren.length > 0) {
      return NextResponse.json(
        {
          message: 'Cannot delete categories with subcategories',
          code: 'HAS_CHILDREN',
          categories: categoriesWithChildren,
        },
        { status: 400 }
      );
    }

    // Remove the categories
    const initialLength = mockCategories.length;
    for (const id of categoryIds) {
      const index = mockCategories.findIndex((cat: Category) => cat.id === id);
      if (index !== -1) {
        mockCategories.splice(index, 1);
      }
    }

    const deletedCount = initialLength - mockCategories.length;
    console.log(`${deletedCount} categories deleted successfully`);

    return NextResponse.json({
      message: `${deletedCount} categories deleted successfully`,
      deletedCount,
    });

  } catch (error: any) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      {
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
      },
      { status: error.status || 500 }
    );
  }
} 