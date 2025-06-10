import { NextRequest, NextResponse } from 'next/server';

// Create a local mock wishlist
// In a real implementation, this would be a database query
const mockWishlist = [
  { productId: '1', userId: '123', addedAt: new Date().toISOString() },
  { productId: '2', userId: '123', addedAt: new Date().toISOString() },
  { productId: '3', userId: '123', addedAt: new Date().toISOString() }
];

// Helper function to extract productId safely
async function extractProductId(params: any): Promise<string> {
  // In Next.js 14, params might be a Promise
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  return resolvedParams?.productId || '';
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Verify authentication
    const hasAuth = req.headers.get('authorization')?.startsWith('Bearer ');
    
    if (!hasAuth) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Extract productId safely
    const productId = await extractProductId(params);
    
    // Find the wishlist item to delete
    const itemIndex = mockWishlist.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      return new NextResponse('Wishlist item not found', { status: 404 });
    }
    
    // In a real implementation, we would delete this from a database
    const index = mockWishlist.findIndex(item => item.productId === productId);
    if (index !== -1) {
      mockWishlist.splice(index, 1);
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error removing wishlist item:', error);
    return new NextResponse('Failed to remove wishlist item', { status: 500 });
  }
} 