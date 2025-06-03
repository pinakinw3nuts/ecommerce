import { NextRequest, NextResponse } from 'next/server';

// Mock sitemap data
const mockSitemapEntries = [
  { slug: "", updatedAt: "2024-06-01T10:00:00Z" },
  { slug: "products/t-shirt" },
  { slug: "products/hoodie", updatedAt: "2024-05-28T14:30:00Z" },
  { slug: "products/sneakers", updatedAt: "2024-05-30T09:15:00Z" },
  { slug: "about-us", updatedAt: "2024-06-02T08:00:00Z" },
  { slug: "privacy-policy", updatedAt: "2024-04-15T16:45:00Z" },
  { slug: "terms-of-service", updatedAt: "2024-04-15T16:45:00Z" },
  { slug: "contact-us" },
  { slug: "blog/summer-fashion-trends", updatedAt: "2024-05-20T11:20:00Z" },
  { slug: "blog/sustainable-clothing", updatedAt: "2024-05-25T14:10:00Z" }
];

export async function GET(req: NextRequest) {
  try {
    // In a real implementation, this would fetch data from a CMS or database
    // containing all public pages and their last update dates
    
    return NextResponse.json(mockSitemapEntries);
  } catch (error) {
    console.error('Error fetching sitemap data:', error);
    return new NextResponse('Failed to fetch sitemap data', { status: 500 });
  }
} 