import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Mock brands data (same as in the main brands route)
const mockBrands = Array.from({ length: 50 }, (_, i) => ({
  id: `brand-${i + 1}`,
  name: `Brand ${i + 1}`,
  slug: `brand-${i + 1}`,
  website: i % 3 === 0 ? `https://brand${i + 1}.com` : undefined,
  description: i % 2 === 0 ? `Description for Brand ${i + 1}` : undefined,
  isActive: Math.random() > 0.3,
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  updatedAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
}));

export async function POST(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const { brandIds } = await request.json();

    let brandsToExport = mockBrands;
    if (brandIds !== 'all') {
      if (!Array.isArray(brandIds)) {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
      brandsToExport = mockBrands.filter(brand => brandIds.includes(brand.id));
    }

    // Convert brands to CSV
    const headers = ['ID', 'Name', 'Slug', 'Website', 'Description', 'Status', 'Created At', 'Updated At'];
    const rows = brandsToExport.map(brand => [
      brand.id,
      brand.name,
      brand.slug,
      brand.website || '',
      brand.description || '',
      brand.isActive ? 'Active' : 'Inactive',
      brand.createdAt,
      brand.updatedAt,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Create response with CSV file
    const response = new NextResponse(csv);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', 'attachment; filename=brands.csv');

    return response;
  } catch (error) {
    console.error('Error exporting brands:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 